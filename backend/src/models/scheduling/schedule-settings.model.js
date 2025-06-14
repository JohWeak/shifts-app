// backend/src/models/scheduling/schedule-settings.model.js
module.exports = (sequelize, DataTypes) => {
    const ScheduleSettings = sequelize.define('ScheduleSettings', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        auto_generation_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
        generation_day: {
            type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
            defaultValue: 'wednesday'
        },
        generation_time: { type: DataTypes.TIME, defaultValue: '13:00:00' },
        constraint_deadline_hours: { type: DataTypes.INTEGER, defaultValue: 72 },
        max_cannot_work_days: { type: DataTypes.INTEGER, defaultValue: 2 },
        schedule_weeks_ahead: { type: DataTypes.INTEGER, defaultValue: 1 },
        max_consecutive_work_days: { type: DataTypes.INTEGER, defaultValue: 6 },
        min_rest_base_hours: { type: DataTypes.INTEGER, defaultValue: 11 },
        rest_calculation_method: {
            type: DataTypes.ENUM('fixed', 'dynamic', 'shift_based'),
            defaultValue: 'dynamic'
        },
        dynamic_rest_multiplier: { type: DataTypes.DECIMAL(3, 2), defaultValue: 1.0 },
        max_shifts_per_day: { type: DataTypes.INTEGER, defaultValue: 1 },
        night_shift_rest_bonus: { type: DataTypes.INTEGER, defaultValue: 3 },
        long_shift_threshold: { type: DataTypes.INTEGER, defaultValue: 10 },
        long_shift_rest_bonus: { type: DataTypes.INTEGER, defaultValue: 2 },
        site_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'work_sites', key: 'site_id' }
        }
    }, {
        tableName: 'schedule_settings',
        timestamps: true
    });
    return ScheduleSettings;
};