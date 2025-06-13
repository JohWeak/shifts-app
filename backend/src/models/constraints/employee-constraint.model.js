module.exports = (sequelize, DataTypes) => {
    const EmployeeConstraint = sequelize.define('EmployeeConstraint', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        emp_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'emp_id' } },
        constraint_type: { type: DataTypes.ENUM('cannot_work', 'prefer_work'), allowNull: false },
        applies_to: { type: DataTypes.ENUM('specific_date', 'day_of_week'), allowNull: false },
        target_date: { type: DataTypes.DATEONLY, allowNull: true },
        day_of_week: { type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'), allowNull: true },
        shift_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'shifts', key: 'shift_id' } },
        is_permanent: { type: DataTypes.BOOLEAN, defaultValue: false },
        status: { type: DataTypes.ENUM('active', 'expired'), defaultValue: 'active' },
        reason: { type: DataTypes.TEXT, allowNull: true }
    }, {
        tableName: 'employee_constraints',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        associate: function(models) {
            EmployeeConstraint.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
            EmployeeConstraint.belongsTo(models.Shift, { foreignKey: 'shift_id', as: 'shift' });
        }
    });
    return EmployeeConstraint;
};