// backend/src/models/scheduling/schedule-assignment.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const ScheduleAssignment = sequelize.define('ScheduleAssignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'schedules',
            key: 'id'
        },
        comment: 'Reference to the schedule'
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'emp_id'
        },
        comment: 'Employee assigned to the shift'
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shifts',
            key: 'shift_id'
        },
        comment: 'Shift type (morning, evening, night)'
    },
    position_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'positions',
            key: 'pos_id'
        },
        comment: 'Position the employee is working'
    },
    work_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Specific date for this assignment'
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'confirmed', 'absent', 'replaced'),
        defaultValue: 'scheduled',
        comment: 'Status of the assignment'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional notes for the assignment'
    }
}, {
    tableName: 'schedule_assignments',
    timestamps: true,
    indexes: [
        // Unique constraint: one employee can't have multiple assignments at the same time
        {
            unique: true,
            fields: ['emp_id', 'work_date', 'shift_id']
        },
        // Performance indexes
        {
            fields: ['schedule_id', 'work_date']
        },
        {
            fields: ['position_id', 'work_date']
        }
    ]
});

module.exports = ScheduleAssignment;