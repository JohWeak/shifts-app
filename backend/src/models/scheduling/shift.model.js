// backend/src/models/scheduling/shift.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Shift = sequelize.define('Shift', {
    shift_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shift_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in hours'
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    shift_type: {
        type: DataTypes.ENUM('morning', 'day', 'evening', 'night'),
        allowNull: false,
        comment: 'Type of shift for rest calculation purposes'
    },
    is_night_shift: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if shift includes night hours (22:00-06:00)'
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'emp_id'
        }
    }
}, {
    tableName: 'shifts',
    timestamps: true
});

module.exports = Shift;