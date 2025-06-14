// backend/src/models/scheduling/schedule-assignment.model.js
module.exports = (sequelize, DataTypes) => {
    const ScheduleAssignment = sequelize.define('ScheduleAssignment', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        schedule_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'schedules', key: 'id' }
        },
        emp_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'employees', key: 'emp_id' }
        },
        shift_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'shifts', key: 'shift_id' }
        },
        position_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'positions', key: 'pos_id' }
        },
        work_date: { type: DataTypes.DATEONLY, allowNull: false },
        status: {
            type: DataTypes.ENUM('scheduled', 'completed', 'absent', 'late'),
            defaultValue: 'scheduled'
        },
        notes: { type: DataTypes.TEXT }
    }, {
        tableName: 'schedule_assignments',
        timestamps: true
    });
    return ScheduleAssignment;
};