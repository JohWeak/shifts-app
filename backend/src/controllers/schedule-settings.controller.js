// backend/src/controllers/schedule-settings.controller.js
const { ScheduleSettings, WorkSite } = require('../models/associations');

// Get schedule settings for the work site
exports.getSettings = async (req, res) => {
    try {
        const siteId = req.params.siteId;

        const settings = await ScheduleSettings.findOne({
            where: { site_id: siteId },
            include: [{
                association: 'workSite',
                attributes: ['site_id', 'site_name']
            }]
        });

        if (!settings) {
            return res.status(404).json({ message: 'Schedule settings not found for this site' });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving schedule settings',
            error: error.message
        });
    }
};

// Create or update schedule settings
exports.updateSettings = async (req, res) => {
    try {
        const siteId = req.params.siteId;

        // Verify the work site exists
        const workSite = await WorkSite.findByPk(siteId);
        if (!workSite) {
            return res.status(404).json({ message: 'Work site not found' });
        }

        // Find existing settings or create new
        let settings = await ScheduleSettings.findOne({ where: { site_id: siteId } });

        if (settings) {
            // Update existing settings
            await settings.update(req.body);
        } else {
            // Create new settings
            settings = await ScheduleSettings.create({
                ...req.body,
                site_id: siteId
            });
        }

        // Fetch updated settings with work site info
        const updatedSettings = await ScheduleSettings.findOne({
            where: { site_id: siteId },
            include: [{ association: 'workSite' }]
        });

        res.json({
            message: 'Schedule settings updated successfully',
            settings: updatedSettings
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating schedule settings',
            error: error.message
        });
    }
};

// Get all sites with their settings
exports.getAllSitesSettings = async (req, res) => {
    try {
        const sites = await WorkSite.findAll({
            include: [{
                association: 'scheduleSettings',
                required: false // Include sites even without settings
            }],
            order: [['site_name', 'ASC']]
        });

        res.json(sites);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving sites settings',
            error: error.message
        });
    }
};