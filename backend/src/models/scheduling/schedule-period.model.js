// backend/src/models/scheduling/schedule-period.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const SchedulePeriod = sequelize.define('SchedulePeriod', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    constraint_deadline: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Deadline for employees to submit constraints'
    },
    generation_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When schedule was generated'
    },
    status: {
        type: DataTypes.ENUM('collecting_constraints', 'generating', 'review', 'approved', 'published'),
        defaultValue: 'collecting_constraints'
    },
    site_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'work_sites', key: 'site_id' }
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'emp_id' }
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'emp_id' }
    }
}, {
    tableName: 'schedule_periods',
    timestamps: true
});

module.exports = SchedulePeriod;