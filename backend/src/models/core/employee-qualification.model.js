// backend/src/models/core/employee-qualification.model.js
module.exports = (sequelize, DataTypes) => {
    let EmployeeQualification;
    EmployeeQualification = sequelize.define('EmployeeQualification', {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        emp_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {model: 'employees', key: 'emp_id'}
        },
        qualification_name: {type: DataTypes.STRING(255), allowNull: false},
        level: {
            type: DataTypes.ENUM('basic', 'intermediate', 'advanced'),
            defaultValue: 'basic'
        },
        certified_date: {type: DataTypes.DATEONLY},
        expires_date: {type: DataTypes.DATEONLY}
    }, {
        tableName: 'employee_qualifications',
        timestamps: true
    });
    return EmployeeQualification;
};