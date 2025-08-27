// backend/src/models/core/employee.model.js
module.exports = (sequelize, DataTypes) => {
    let Employee;
    Employee = sequelize.define('Employee', {
        emp_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        first_name: {type: DataTypes.STRING, allowNull: false},
        last_name: {type: DataTypes.STRING, allowNull: false},
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Please enter a valid email address'
                },
                len: [1, 255]
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                len: [0, 20]
            }
        },
        country: {type: DataTypes.STRING(100), allowNull: true},
        city: {type: DataTypes.STRING(100), allowNull: true},
        address: {type: DataTypes.TEXT, allowNull: true},
        login: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
                isAlphanumeric: true
            }
        },

        password: {type: DataTypes.STRING, allowNull: false},
        status: {type: DataTypes.ENUM('active', 'inactive', 'admin'), defaultValue: 'active'},
        role: {type: DataTypes.ENUM('employee', 'admin'), defaultValue: 'employee'},
        default_position_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {model: 'positions', key: 'pos_id'}
        },
        work_site_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {model: 'work_sites', key: 'site_id'},
            comment: 'Assigned work site for the employee, NULL means can work at any site'
        },
        deactivated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        deactivated_by_position: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'positions',
                key: 'pos_id'
            }
        },
        deactivated_by_worksite: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_sites',
                key: 'site_id'
            }
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
        }
    });
    return Employee;
};