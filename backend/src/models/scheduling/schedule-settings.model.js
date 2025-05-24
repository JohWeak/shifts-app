// backend/src/models/scheduling/schedule-settings.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const ScheduleSettings = sequelize.define('ScheduleSettings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    auto_generation_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    generation_day: {
        type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
        defaultValue: 'wednesday'
    },
    generation_time: {
        type: DataTypes.TIME,
        defaultValue: '13:00:00'
    },
    constraint_deadline_hours: {
        type: DataTypes.INTEGER,
        defaultValue: 72,
        comment: 'Hours before generation when constraint submission closes'
    },
    max_cannot_work_days: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        comment: 'Maximum cannot_work constraints per employee per week'
    },
    schedule_weeks_ahead: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'How many weeks ahead to generate schedule'
    },
    max_consecutive_work_days: {
        type: DataTypes.INTEGER,
        defaultValue: 6,
        comment: 'Recommended max consecutive working days'
    },
    min_rest_base_hours: {
        type: DataTypes.INTEGER,
        defaultValue: 11,
        comment: 'Base minimum rest hours between shifts'
    },
    rest_calculation_method: {
        type: DataTypes.ENUM('fixed', 'dynamic', 'shift_based'),
        defaultValue: 'dynamic',
        comment: 'How to calculate minimum rest: fixed=always min_rest_base_hours, dynamic=shift_duration+base, shift_based=by shift type'
    },
    dynamic_rest_multiplier: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 1.0,
        comment: 'Multiplier for dynamic rest calculation (1.0 = same as shift duration, 1.5 = 1.5x shift duration)'
    },
    max_shifts_per_day: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Maximum shifts per employee per day'
    },
    night_shift_rest_bonus: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        comment: 'Additional rest hours required after night shifts'
    },
    long_shift_threshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: 'Shifts longer than this (hours) are considered long shifts'
    },
    long_shift_rest_bonus: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        comment: 'Additional rest hours required after long shifts'
    },
    site_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'work_sites', key: 'site_id' }
    }
}, {
    tableName: 'schedule_settings',
    timestamps: true
});

module.exports = ScheduleSettings;