'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('system_settings', {
            setting_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            setting_key: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            setting_value: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            setting_type: {
                type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
                allowNull: false,
                defaultValue: 'string',
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_editable: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add index for fast lookup by setting_key (only if it doesn't exist)
        try {
            await queryInterface.addIndex('system_settings', ['setting_key'], {
                unique: true,
                name: 'idx_system_settings_key',
            });
        } catch (error) {
            if (!error.message.includes('Duplicate key name')) {
                throw error;
            }
            // Index already exists, continue
        }

        // Insert default settings
        await queryInterface.bulkInsert('system_settings', [
            {
                setting_key: 'weekStartDay',
                setting_value: '1',
                setting_type: 'number',
                description: 'First day of the week (0=Sunday, 1=Monday)',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'dateFormat',
                setting_value: 'DD/MM/YYYY',
                setting_type: 'string',
                description: 'Date display format',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'timeFormat',
                setting_value: '24h',
                setting_type: 'string',
                description: 'Time display format (24h or 12h)',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'autoPublishSchedule',
                setting_value: 'false',
                setting_type: 'boolean',
                description: 'Automatically publish generated schedules',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'autoAssignShifts',
                setting_value: 'false',
                setting_type: 'boolean',
                description: 'Automatically assign shifts to employees',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'defaultScheduleDuration',
                setting_value: '7',
                setting_type: 'number',
                description: 'Default schedule duration in days',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'minRestBetweenShifts',
                setting_value: '11',
                setting_type: 'number',
                description: 'Minimum rest hours between shifts (legal requirement)',
                is_editable: false,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'maxConsecutiveDays',
                setting_value: '6',
                setting_type: 'number',
                description: 'Maximum consecutive working days',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'algorithmMaxTime',
                setting_value: '120',
                setting_type: 'number',
                description: 'Maximum time for schedule optimization (seconds)',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'defaultEmployeesPerShift',
                setting_value: '1',
                setting_type: 'number',
                description: 'Default number of employees per shift',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'optimizationMode',
                setting_value: 'balanced',
                setting_type: 'string',
                description: 'Algorithm optimization mode (fast/balanced/thorough)',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'fairnessWeight',
                setting_value: '50',
                setting_type: 'number',
                description: 'Balance between efficiency and fairness (0-100)',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'maxCannotWorkDays',
                setting_value: '2',
                setting_type: 'number',
                description: 'Maximum cannot work days per week',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'maxPreferWorkDays',
                setting_value: '3',
                setting_type: 'number',
                description: 'Maximum prefer work days per week',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'strictLegalCompliance',
                setting_value: 'true',
                setting_type: 'boolean',
                description: 'Enforce strict legal compliance',
                is_editable: false,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'enableNotifications',
                setting_value: 'true',
                setting_type: 'boolean',
                description: 'Enable system notifications',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'notifySchedulePublished',
                setting_value: 'true',
                setting_type: 'boolean',
                description: 'Notify when schedule is published',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'notifyShiftReminder',
                setting_value: 'true',
                setting_type: 'boolean',
                description: 'Send shift reminder notifications',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'notifyScheduleChange',
                setting_value: 'true',
                setting_type: 'boolean',
                description: 'Notify about schedule changes',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'sessionTimeout',
                setting_value: '60',
                setting_type: 'number',
                description: 'Session timeout in minutes',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'passwordMinLength',
                setting_value: '8',
                setting_type: 'number',
                description: 'Minimum password length',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                setting_key: 'requirePasswordChange',
                setting_value: 'false',
                setting_type: 'boolean',
                description: 'Require periodic password changes',
                is_editable: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('system_settings');
    },
};