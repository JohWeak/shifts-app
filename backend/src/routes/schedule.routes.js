// backend/src/routes/schedule.routes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, isAdmin} = require('../middlewares/auth.middleware');

// Генерировать расписание
router.post('/generate', verifyToken, scheduleController.generateNextWeekSchedule);

// Employee routes - get weekly schedule for their position
router.get('/weekly', verifyToken, scheduleController.getWeeklySchedule);

// Admin routes - get full schedule view
router.get('/admin/weekly', [verifyToken, isAdmin], scheduleController.getAdminWeeklySchedule);

// Получить все расписания
router.get('/', verifyToken, scheduleController.getAllSchedules);

// Получить детали расписания
router.get('/:scheduleId', verifyToken, scheduleController.getScheduleDetails);

// Обновить статус расписания
router.put('/:scheduleId/status', verifyToken, scheduleController.updateScheduleStatus);




module.exports = router;