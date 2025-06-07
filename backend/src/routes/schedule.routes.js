// backend/src/routes/schedule.routes.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// === EMPLOYEE ROUTES (для обычных сотрудников) ===
//router.get('/my-schedule', verifyToken, scheduleController.getMySchedule);
router.get('/weekly', verifyToken, scheduleController.getWeeklySchedule);

// === ADMIN ROUTES (только для администраторов) ===
// Получить все расписания
router.get('/', [verifyToken, isAdmin], scheduleController.getAllSchedules);

// Получить детали конкретного расписания
router.get('/:scheduleId', [verifyToken, isAdmin], scheduleController.getScheduleDetails);

// Генерация нового расписания
router.post('/generate', [verifyToken, isAdmin], scheduleController.generateNextWeekSchedule);

// Сравнение алгоритмов
router.post('/compare-algorithms', [verifyToken, isAdmin], scheduleController.compareAllAlgorithms);

// Обновление статуса расписания
router.put('/:scheduleId/status', [verifyToken, isAdmin], scheduleController.updateScheduleStatus);

// Экспорт расписания
router.get('/:scheduleId/export', [verifyToken, isAdmin], scheduleController.exportSchedule);

// Дублирование расписания
router.post('/:scheduleId/duplicate', [verifyToken, isAdmin], scheduleController.duplicateSchedule);

// Удаление расписания
router.delete('/:scheduleId', [verifyToken, isAdmin], scheduleController.deleteSchedule);

// Статистика по расписаниям
router.get('/stats/overview', [verifyToken, isAdmin], scheduleController.getScheduleStats);

module.exports = router;