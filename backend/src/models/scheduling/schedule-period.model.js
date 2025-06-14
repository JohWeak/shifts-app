// backend/src/models/scheduling/schedule-period.model.js
module.exports = (sequelize, DataTypes) => {
    const SchedulePeriod = sequelize.define('SchedulePeriod', {
        period_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        start_date: { type: DataTypes.DATE, allowNull: false },
        end_date: { type: DataTypes.DATE, allowNull: false },
        is_holiday: { type: DataTypes.BOOLEAN, defaultValue: false },
        description: { type: DataTypes.STRING(255) }
    }, {
        tableName: 'schedule_periods',
        timestamps: true
    });
    return SchedulePeriod;
};