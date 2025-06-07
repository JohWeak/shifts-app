// backend/src/models/constraints/employee-constraint.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const EmployeeConstraint = sequelize.define('EmployeeConstraint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'emp_id' }
    },
    constraint_type: {
        type: DataTypes.ENUM('cannot_work', 'prefer_work'),
        allowNull: false
    },
    applies_to: {
        type: DataTypes.ENUM('specific_date', 'day_of_week'),
        allowNull: false
    },
    target_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'For specific date constraints'
    },
    day_of_week: {
        type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
        allowNull: true
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'shifts', key: 'shift_id' }
    },
    is_permanent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('active', 'expired'),
        defaultValue: 'active'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'employee_constraints',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['emp_id', 'target_date'] },
        { fields: ['emp_id', 'day_of_week'] },
        { fields: ['constraint_type', 'applies_to'] }
    ]
});

module.exports = EmployeeConstraint;