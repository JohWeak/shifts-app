const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

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
        defaultValue: 1
    },
    num_of_shifts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    site_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'positions',
    timestamps: true
});

module.exports = Position;