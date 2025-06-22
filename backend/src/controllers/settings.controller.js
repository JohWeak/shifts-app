// backend/src/controllers/settings.controller.js
const db = require('../models');
const { Position, WorkSite } = db;

const getSystemSettings = async (req, res) => {
    try {
        // Get all positions for settings
        const positions = await Position.findAll({
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }],
            order: [['pos_name', 'ASC']]
        });

        // Get all work sites
        const workSites = await WorkSite.findAll({
            order: [['site_name', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                positions,
                workSites,
                weekStartDay: 0,
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                language: 'en',
                enableNotifications: true,
                autoPublishSchedule: false,
                defaultScheduleDuration: 7,
                minRestBetweenShifts: 8,
                maxCannotWorkDays: 2,
                maxPreferWorkDays: 3,
                defaultEmployeesPerShift: 1,
                algorithmMaxTime: 120,
                strictLegalCompliance: true
            }
        });
    } catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system settings',
            error: error.message
        });
    }
};

const updateSystemSettings = async (req, res) => {
    try {
        // Implement update logic here
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message
        });
    }
};

module.exports = {
    getSystemSettings,
    updateSystemSettings
};