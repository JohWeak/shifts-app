// backend/src/models/core/employee.model.js
module.exports = (sequelize, DataTypes) => {
    let Employee;
    Employee = sequelize.define('Employee', {
        emp_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Please enter a valid email address',
                },
                len: [1, 255],
            },
        },
        receive_schedule_emails: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        locale: {
            type: DataTypes.STRING(5), // 'en', 'ru', 'he'
            defaultValue: 'en',
            allowNull: false,
        },

        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                len: [0, 20],
            },
        },
        country: { type: DataTypes.STRING(100), allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        login: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
                isAlphanumeric: true,
            },
        },

        password: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
        role: { type: DataTypes.ENUM('employee', 'admin'), defaultValue: 'employee' },
        admin_work_sites_scope: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Array of work site IDs that this admin can manage. NULL means no admin rights, empty array means no sites.'
        },
        is_super_admin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if this admin has super admin privileges (can manage all sites and create admins)'
        },
        default_position_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'positions', key: 'pos_id' },
        },
        work_site_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'work_sites', key: 'site_id' },
            comment: 'Assigned work site for the employee, NULL means can work at any site',
        },
        deactivated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deactivated_by_position: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'positions',
                key: 'pos_id',
            },
        },
        deactivated_by_worksite: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_sites',
                key: 'site_id',
            },
        },
    }, {
        tableName: 'employees',
        timestamps: true,
        hooks: {
            beforeValidate: (employee) => {
                if (employee.email === '') {
                    employee.email = null;
                }
            },
        },
    });
    return Employee;
};