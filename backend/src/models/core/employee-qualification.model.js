module.exports = (sequelize, DataTypes) => {
    const EmployeeQualification = sequelize.define('EmployeeQualification', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        emp_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'emp_id' } },
        qualification_name: { type: DataTypes.STRING, allowNull: false },
        level: { type: DataTypes.ENUM('basic', 'intermediate', 'advanced'), defaultValue: 'basic' },
        certified_date: { type: DataTypes.DATEONLY, allowNull: true },
        expires_date: { type: DataTypes.DATEONLY, allowNull: true }
    }, {
        tableName: 'employee_qualifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',

    });
    return EmployeeQualification;
};