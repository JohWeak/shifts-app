// backend/src/models/settings/system-settings.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SystemSettings = sequelize.define('SystemSettings', {
        setting_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        setting_key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        setting_value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        setting_type: {
            type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
            allowNull: false,
            defaultValue: 'string',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_editable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'system_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['setting_key'],
            },
        ],
    });

    return SystemSettings;
};