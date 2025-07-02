// backend/src/models/core/employee.model.js
module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
        emp_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        first_name: {type: DataTypes.STRING, allowNull: false},
        last_name: {type: DataTypes.STRING, allowNull: false},
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Please enter a valid email address',
                    args: true
                },
                // Добавляем условную валидацию - проверяем email только если он указан
                customValidator(value) {
                    if (value === null || value === '') {
                        return true; // Пустое значение разрешено
                    }
                    // Если значение есть, оно должно быть валидным email
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        throw new Error('Invalid email format');
                    }
                }
            }
        },
        phone: {type: DataTypes.STRING(20), allowNull: true},
        country: {type: DataTypes.STRING(100), allowNull: true},
        city: {type: DataTypes.STRING(100), allowNull: true},
        address: {type: DataTypes.TEXT, allowNull: true},
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
        timestamps: true,
        hooks: {
            beforeValidate: (employee) => {
                if (employee.email === '') {
                    employee.email = null;
                }
            }
        },
        deactivated_by_position: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'positions',
                key: 'pos_id'
            }
        },
        deactivated_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    });
    return Employee;
};