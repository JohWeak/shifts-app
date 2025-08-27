// backend/src/routes/schedule-settings.routes.js
const express = require('express');
const scheduleSettingsController = require('../controllers/settings/schedule-settings.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use([verifyToken, isAdmin]);

router.get('/sites', scheduleSettingsController.getAllSitesSettings);
router.get('/site/:siteId', scheduleSettingsController.getSettings);
router.put('/site/:siteId', scheduleSettingsController.updateSettings);

module.exports = router;