const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    text_file: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON representation of the schedule'
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
    }
}, {
    tableName: 'schedules',
    timestamps: true
});

module.exports = Schedule;