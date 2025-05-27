// backend/src/routes/schedule.routes.js
const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Employee routes - get weekly schedule for their position
router.get('/weekly', verifyToken, scheduleController.getWeeklySchedule);

// Admin routes - get full schedule view
router.get('/admin/weekly', [verifyToken, isAdmin], scheduleController.getAdminWeeklySchedule);

// Test route
router.get('/', verifyToken, (req, res) => {
    res.json({ message: 'Schedule API is working' });
});

module.exports = router;