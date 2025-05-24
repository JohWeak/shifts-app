// backend/src/models/constraints/legal-constraint.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const LegalConstraint = sequelize.define('LegalConstraint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rule_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the legal rule'
    },
    rule_type: {
        type: DataTypes.ENUM(
            'max_daily_hours',        // Maximum 12 hours per day
            'min_rest_between_shifts', // Minimum 8 hours between shifts (legal)
            'weekly_rest',            // Minimum 36 hours weekly rest
            'mandatory_day_off',      // Religious day off
            'max_night_shifts',       // Night shift limitations
            'max_overtime_weekly',    // Maximum 15 overtime hours/week
            'max_consecutive_days'    // Maximum consecutive working days
        ),
        allowNull: false
    },
    constraint_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Numeric value for the constraint (hours, days, etc.)'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    description: {
        type: DataTypes.TEXT,
        comment: 'Description of the legal requirement'
    }
}, {
    tableName: 'legal_constraints',
    timestamps: true
});

module.exports = LegalConstraint;