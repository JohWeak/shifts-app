// backend/src/routes/settings.routes.js
const express = require('express');
const {verifyToken, isAdmin} = require('../middlewares/auth.middleware');
const systemSettingsController = require('../controllers/settings/system-settings.controller');
const scheduleSettingsController = require('../controllers/settings/schedule-settings.controller');

const router = express.Router();

// === System Settings Routes ===
router.get('/system', verifyToken, systemSettingsController.getSystemSettings);
router.put('/system', verifyToken, isAdmin, systemSettingsController.updateSystemSettings);

// === Schedule Settings Routes ===
// Все middleware применяются здесь, чтобы не дублировать
const scheduleRouter = express.Router();
scheduleRouter.use(verifyToken, isAdmin);

scheduleRouter.get('/sites', scheduleSettingsController.getAllSitesSettings);
scheduleRouter.get('/site/:siteId', scheduleSettingsController.getSettings);
scheduleRouter.put('/site/:siteId', scheduleSettingsController.updateSettings);

// Вкладываем роутер настроек расписания в основной роутер настроек
router.use('/schedule', scheduleRouter);

module.exports = router;