// backend/src/scripts/createAdmin.js
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log('DB Connection Settings:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

// Инициализация Sequelize с явными параметрами
const sequelize = new Sequelize(
    process.env.DB_NAME || 'shifts_db',
    process.env.DB_USER || 'shifts_user',
    process.env.DB_PASSWORD || 'your_password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: true // включаем логирование для отладки
    }
);

// Определение модели Employee
const Employee = sequelize.define('Employee', {
    emp_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    last_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    login: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.ENUM('active', 'inactive', 'admin'),
        defaultValue: 'active'
    }
}, {
    tableName: 'employees',
    timestamps: true
});

async function createAdmin() {
    try {
        console.log('Attempting to connect to database...');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Синхронизация модели с базой данных
        await Employee.sync({ alter: true });
        console.log('Employee model synchronized with database.');

        // Проверка существования администратора
        const adminExists = await Employee.findOne({
            where: { login: 'admin' }
        });

        if (adminExists) {
            console.log('Admin user already exists with ID:', adminExists.emp_id);
            await sequelize.close();
            return;
        }

        // Хеширование пароля
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully.');

        // Создание администратора
        const admin = await Employee.create({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
            login: 'admin',
            password: hashedPassword,
            status: 'admin',
            profession: 'Administrator'
        });

        console.log('Admin user created successfully with ID:', admin.emp_id);
        console.log('Use these credentials to log in:');
        console.log('Login:', 'admin');
        console.log('Password:', password);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        if (sequelize) {
            await sequelize.close();
            console.log('Database connection closed.');
        }
    }
}

createAdmin();