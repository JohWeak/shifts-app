// backend/src/models/core/employee.model.js
module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
        emp_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        first_name: {type: DataTypes.STRING, allowNull: false},
        last_name: {type: DataTypes.STRING, allowNull: false},
        email: {type: DataTypes.STRING, allowNull: false, unique: true, validate: {isEmail: true}},
        login: {type: DataTypes.STRING, allowNull: false, unique: true},
        password: {type: DataTypes.STRING, allowNull: false},
        status: {type: DataTypes.ENUM('active', 'inactive', 'admin'), defaultValue: 'active'},
        role: {type: DataTypes.ENUM('employee', 'admin'), defaultValue: 'employee'},
        default_position_id: {type: DataTypes.INTEGER, allowNull: true, references: {model: 'positions', key: 'pos_id'}},
        work_site_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {model: 'work_sites', key: 'site_id'},
            comment: 'Assigned work site for the employee, NULL means can work at any site'
        }
    }, {
        tableName: 'employees',
        timestamps: true
    });
    return Employee;
};