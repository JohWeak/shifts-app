const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Constraint = sequelize.define('Constraint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Higher number means higher priority'
    }
}, {
    tableName: 'constraints',
    timestamps: true
});

module.exports = Constraint;