// backend/src/models/core/worksite.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const WorkSite = sequelize.define('WorkSite', {
    site_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    site_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'work_sites',
    timestamps: true
});

module.exports = WorkSite;