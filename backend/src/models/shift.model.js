const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

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
        comment: 'Duration in minutes'
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    emp_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'shifts',
    timestamps: true
});

module.exports = Shift;