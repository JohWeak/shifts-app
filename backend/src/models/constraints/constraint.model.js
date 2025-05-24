const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Constraint = sequelize.define('Constraint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'emp_id'
        }
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shifts',
            key: 'shift_id'
        }
    },
    priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 10
        },
        comment: 'Priority level: 1 (lowest) to 10 (highest)'
    },
    constraint_type: {
        type: DataTypes.ENUM('preferred', 'unavailable', 'required'),
        defaultValue: 'preferred',
        comment: 'Type of constraint for this shift'
    }
}, {
    tableName: 'constraints',
    timestamps: true
});

module.exports = Constraint;