// backend/src/routes/schedule-settings.routes.js
const express = require('express');

const {verifyToken, isAdmin} = require('../middlewares/auth.middleware');

module.exports = function (db) {
    const router = express.Router();
    const scheduleSettingsController = require('../controllers/schedule-settings.controller')(db);

// All schedule settings routes require admin privileges
    router.use([verifyToken, isAdmin]);

    router.get('/sites', scheduleSettingsController.getAllSitesSettings);
    router.get('/site/:siteId', scheduleSettingsController.getSettings);
    router.put('/site/:siteId', scheduleSettingsController.updateSettings);

    return router;
};