// backend/test-recommendations.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Исправим импорты
const { Sequelize } = require('sequelize');

// Создадим подключение к базе напрямую
const sequelize = new Sequelize(
    process.env.DB_NAME || 'shifts_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
    }
);

// Определим модели напрямую для теста
const Employee = sequelize.define('Employee', {
    emp_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    email: Sequelize.STRING,
    status: Sequelize.STRING,
    role: Sequelize.STRING,
    default_position_id: Sequelize.INTEGER
}, { tableName: 'employees' });

const Position = sequelize.define('Position', {
    pos_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    pos_name: Sequelize.STRING,
    profession: Sequelize.STRING,
    num_of_emp: Sequelize.INTEGER,
    site_id: Sequelize.INTEGER
}, { tableName: 'positions' });

const EmployeeConstraint = sequelize.define('EmployeeConstraint', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    emp_id: Sequelize.INTEGER,
    constraint_type: Sequelize.STRING,
    applies_to: Sequelize.STRING,
    target_date: Sequelize.DATE,
    day_of_week: Sequelize.STRING,
    shift_id: Sequelize.INTEGER,
    status: Sequelize.STRING,
    reason: Sequelize.TEXT
}, { tableName: 'employee_constraints', timestamps: false });

// Установим связи
Employee.belongsTo(Position, { foreignKey: 'default_position_id', as: 'defaultPosition' });
Employee.hasMany(EmployeeConstraint, { foreignKey: 'emp_id', as: 'constraints' });

async function testRecommendations() {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connected');

        // Простой тест - получить сотрудников с дефолтными позициями
        const employees = await Employee.findAll({
            where: { status: 'active', role: 'employee' },
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    required: false,
                    attributes: ['pos_id', 'pos_name', 'profession']
                }
            ]
        });

        console.log('\n=== EMPLOYEES WITH DEFAULT POSITIONS ===');
        employees.forEach(emp => {
            console.log(`${emp.first_name} ${emp.last_name}: ${emp.defaultPosition?.pos_name || 'No default position'}`);
        });

        // Проверим ограничения
        const constraints = await EmployeeConstraint.findAll({
            where: { status: 'active' },
            include: [{
                model: Employee,
                as: 'employee',
                attributes: ['emp_id', 'first_name', 'last_name']
            }]
        });

        console.log('\n=== EMPLOYEE CONSTRAINTS ===');
        constraints.forEach(constraint => {
            console.log(`${constraint.employee.first_name} ${constraint.employee.last_name}: ${constraint.constraint_type} - ${constraint.reason}`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await sequelize.close();
    }
}

testRecommendations();