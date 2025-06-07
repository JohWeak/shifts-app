// backend/src/routes/schedule.routes.js (финальная версия)
const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Employee routes
router.get('/weekly', verifyToken, scheduleController.getWeeklySchedule);

// Admin routes
router.get('/admin/weekly', [verifyToken, isAdmin], scheduleController.getAdminWeeklySchedule);
router.post('/generate', [verifyToken, isAdmin], scheduleController.generateNextWeekSchedule);
router.get('/list', [verifyToken, isAdmin], scheduleController.getAllSchedules);
router.get('/:scheduleId', [verifyToken, isAdmin], scheduleController.getScheduleDetails);
router.put('/:scheduleId/status', [verifyToken, isAdmin], scheduleController.updateScheduleStatus);

// NEW: Algorithm comparison and testing
router.post('/compare-algorithms', [verifyToken, isAdmin], scheduleController.compareAllAlgorithms);

// Получить все расписания
router.get('/', scheduleController.getAllSchedules);

// Получить детали конкретного расписания
router.get('/:scheduleId', scheduleController.getScheduleDetails);

// Генерация нового расписания
router.post('/generate', scheduleController.generateNextWeekSchedule);

// НОВЫЕ РОУТЫ:
// Сравнение алгоритмов
router.post('/compare-algorithms', scheduleController.compareAllAlgorithms);

// Обновление статуса расписания
router.put('/:scheduleId/status', scheduleController.updateScheduleStatus);

// Экспорт расписания
router.get('/:scheduleId/export', scheduleController.exportSchedule);

// Дублирование расписания
router.post('/:scheduleId/duplicate', scheduleController.duplicateSchedule);

// Статистика по расписаниям
router.get('/stats/overview', scheduleController.getScheduleStats);

router.delete('/:scheduleId', scheduleController.deleteSchedule);


module.exports = router;