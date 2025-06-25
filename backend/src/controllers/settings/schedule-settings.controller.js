// backend/src/controllers/schedule-system-settings.controller.js
const db = require('../../models');
const { ScheduleSettings, WorkSite } = db;

// Get settings for site
const getSettings = async (req, res) => {
    try {
        const siteId = req.params.siteId;

        const settings = await ScheduleSettings.findOne({
            where: { site_id: siteId },
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }]
        });

        if (!settings) {
            return res.status(404).json({ message: 'Schedule settings not found for this site' });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving schedule settings', error: error.message });
    }
};

// Update settings
const updateSettings = async (req, res) => {
    try {
        const siteId = req.params.siteId;

        const workSite = await WorkSite.findByPk(siteId);
        if (!workSite) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        let settings = await ScheduleSettings.findOne({ where: { site_id: siteId } });

        if (settings) {
            await settings.update(req.body);
        } else {
            settings = await ScheduleSettings.create({ ...req.body, site_id: siteId });
        }

        const updatedSettings = await ScheduleSettings.findOne({
            where: { site_id: siteId },
            include: [{ model: WorkSite, as: 'workSite' }]
        });

        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating schedule settings', error: error.message });
    }
};

// Get all sites settings
const getAllSitesSettings = async (req, res) => {
    try {
        const settings = await ScheduleSettings.findAll({
            include: [{ model: WorkSite, as: 'workSite' }]
        });

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving settings', error: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getAllSitesSettings
};