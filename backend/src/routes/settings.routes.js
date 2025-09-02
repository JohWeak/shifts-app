// backend/src/routes/settings.routes.js
const express = require('express');
const {verifyToken, isAdmin, getAccessibleSites} = require('../middlewares/auth.middleware');
const systemSettingsController = require('../controllers/settings/system-settings.controller');
const scheduleSettingsController = require('../controllers/settings/schedule-settings.controller');

const router = express.Router();

// === System Settings Routes ===
router.get('/system', verifyToken, getAccessibleSites, systemSettingsController.getSystemSettings);
router.put('/system', verifyToken, isAdmin, getAccessibleSites, systemSettingsController.updateSystemSettings);

// === Schedule Settings Routes ===
// All middleware applied here to avoid duplication
const scheduleRouter = express.Router();
scheduleRouter.use(verifyToken, isAdmin, getAccessibleSites);

scheduleRouter.get('/sites', scheduleSettingsController.getAllSitesSettings);
scheduleRouter.get('/site/:siteId', scheduleSettingsController.getSettings);
scheduleRouter.put('/site/:siteId', scheduleSettingsController.updateSettings);

// Mount schedule settings router into main settings router
router.use('/schedule', scheduleRouter);

module.exports = router;