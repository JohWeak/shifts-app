'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add site_id column to system_settings table
        await queryInterface.addColumn('system_settings', 'site_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'work_sites',
                key: 'site_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Work Site ID for site-specific settings. NULL for global settings.'
        });

        // Add index for site_id
        await queryInterface.addIndex('system_settings', ['site_id'], {
            name: 'idx_system_settings_site_id'
        });

        // Drop the unique constraint on setting_key since we now allow duplicates for different sites
        await queryInterface.removeIndex('system_settings', 'system_settings_setting_key_key');
        
        // Add composite unique constraint for setting_key + site_id
        await queryInterface.addIndex('system_settings', ['setting_key', 'site_id'], {
            unique: true,
            name: 'idx_system_settings_key_site'
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove composite unique constraint
        await queryInterface.removeIndex('system_settings', 'idx_system_settings_key_site');
        
        // Restore original unique constraint on setting_key
        await queryInterface.addIndex('system_settings', ['setting_key'], {
            unique: true,
            name: 'system_settings_setting_key_key'
        });

        // Remove site_id index
        await queryInterface.removeIndex('system_settings', 'idx_system_settings_site_id');
        
        // Remove site_id column
        await queryInterface.removeColumn('system_settings', 'site_id');
    }
};