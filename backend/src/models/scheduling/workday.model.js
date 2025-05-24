// backend/src/models/scheduling/workday.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const WorkDay = sequelize.define('WorkDay', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    pos_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'positions',
            key: 'pos_id'
        }
    }
}, {
    tableName: 'work_days',
    timestamps: true
});

module.exports = WorkDay;