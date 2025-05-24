// backend/src/models/scheduling/position.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Position = sequelize.define('Position', {
    pos_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pos_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profession: {
        type: DataTypes.STRING,
        allowNull: false
    },
    num_of_emp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Number of employees required for this position'
    },
    num_of_shifts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Number of shifts per day for this position'
    },
    site_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'work_sites',
            key: 'site_id'
        }
    }
}, {
    tableName: 'positions',
    timestamps: true
});

module.exports = Position;