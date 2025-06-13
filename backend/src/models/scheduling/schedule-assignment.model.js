module.exports = (sequelize, DataTypes) => {
    const ScheduleAssignment = sequelize.define('ScheduleAssignment', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        schedule_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'schedules', key: 'id' } },
        emp_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'emp_id' } },
        shift_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'shifts', key: 'shift_id' } },
        position_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'positions', key: 'pos_id' } },
        work_date: { type: DataTypes.DATEONLY, allowNull: false },
        status: { type: DataTypes.ENUM('scheduled', 'confirmed', 'absent', 'replaced'), defaultValue: 'scheduled' },
        notes: { type: DataTypes.TEXT, allowNull: true }
    }, {
        tableName: 'schedule_assignments',
        timestamps: true,
        associate: function(models) {
            ScheduleAssignment.belongsTo(models.Schedule, { foreignKey: 'schedule_id', as: 'schedule' });
            ScheduleAssignment.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
            ScheduleAssignment.belongsTo(models.Shift, { foreignKey: 'shift_id', as: 'shift' });
            ScheduleAssignment.belongsTo(models.Position, { foreignKey: 'position_id', as: 'position' });
        }
    });
    return ScheduleAssignment;
};