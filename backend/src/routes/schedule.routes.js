// backend/src/routes/schedule.routes.js - УБЕДИСЬ что роут находится В ПРАВИЛЬНОМ МЕСТЕ

const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// === EMPLOYEE ROUTES ===
router.get('/weekly', verifyToken, scheduleController.getWeeklySchedule);

// === ADMIN ROUTES (ВАЖНО: специфичные роуты ПЕРЕД динамическими) ===

// Статистика - ПЕРЕД /:scheduleId
router.get('/stats/overview', [verifyToken, isAdmin], scheduleController.getScheduleStats);

// Рекомендации сотрудников - ПЕРЕД /:scheduleId
router.get('/recommendations/employees', [verifyToken, isAdmin], scheduleController.getRecommendedEmployees);

// Генерация и сравнение - ПЕРЕД /:scheduleId
router.post('/generate', [verifyToken, isAdmin], scheduleController.generateNextWeekSchedule);
router.post('/compare-algorithms', [verifyToken, isAdmin], scheduleController.compareAllAlgorithms);

// Получить все расписания - ПЕРЕД /:scheduleId
router.get('/', [verifyToken, isAdmin], scheduleController.getAllSchedules);

// НОВЫЙ РОУТ - ПЕРЕД /:scheduleId
router.put('/:scheduleId/update-assignments', [verifyToken, isAdmin], scheduleController.updateScheduleAssignments);

// Действия с конкретным расписанием - scheduleId роуты ПОСЛЕ всех остальных
router.get('/:scheduleId/export', [verifyToken, isAdmin], scheduleController.exportSchedule);
router.post('/:scheduleId/duplicate', [verifyToken, isAdmin], scheduleController.duplicateSchedule);
router.put('/:scheduleId/status', [verifyToken, isAdmin], scheduleController.updateScheduleStatus);
router.delete('/:scheduleId', [verifyToken, isAdmin], scheduleController.deleteSchedule);

// Получить детали расписания - САМЫЙ ПОСЛЕДНИЙ
router.get('/:scheduleId', [verifyToken, isAdmin], scheduleController.getScheduleDetails);

module.exports = router;