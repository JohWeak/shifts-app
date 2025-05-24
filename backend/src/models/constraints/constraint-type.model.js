// backend/src/models/constraints/constraint-type.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const ConstraintType = sequelize.define('ConstraintType', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM(
            'cannot_work',      // Cannot work (blocking)
            'prefer_work',      // Prefer to work
            'neutral',          // Neutral (can work)
            'permanent_schedule' // Fixed permanent schedule
        ),
        allowNull: false
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: { min: 1, max: 10 }
    },
    is_permanent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True for permanent constraints set by admin'
    },
    applies_to: {
        type: DataTypes.ENUM('specific_date', 'day_of_week', 'shift_type'),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'For temporary constraints'
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'For temporary constraints'
    },
    day_of_week: {
        type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
        allowNull: true,
        comment: 'For weekly recurring constraints'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for permanent constraint requests'
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'emp_id' }
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'shifts', key: 'shift_id' }
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'emp_id' }
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'approved'
    }
}, {
    tableName: 'constraint_types',
    timestamps: true
});

module.exports = ConstraintType;