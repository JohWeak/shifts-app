// backend/src/routes/settings.routes.js
const express = require('express');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');
const settingsController = require('../controllers/settings.controller');

const router = express.Router();

router.get('/system', verifyToken, settingsController.getSystemSettings);
router.put('/system', [verifyToken, isAdmin], settingsController.updateSystemSettings);

module.exports = router;