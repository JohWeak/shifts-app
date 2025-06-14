// backend/src/routes/schedule.routes.js
const express = require('express');

module.exports = function(db) {
    const router = express.Router();
    const scheduleController = require('../controllers/schedule.controller')(db);
    const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

    // === EMPLOYEE ROUTES (публичные для залогиненных) ===
    router.get('/weekly', verifyToken, scheduleController.getWeeklySchedule);

    // === ADMIN ROUTES ===

    // --- ОБЩИЕ АДМИНСКИЕ РОУТЫ (без :scheduleId в пути) ---
    // Эти роуты должны быть ОБЯЗАТЕЛЬНО ПЕРЕД роутами с /:scheduleId

    router.get('/stats/overview', [verifyToken, isAdmin], scheduleController.getScheduleStats);
    router.post('/generate', [verifyToken, isAdmin], scheduleController.generateNextWeekSchedule);
    router.post('/compare-algorithms', [verifyToken, isAdmin], scheduleController.compareAllAlgorithms);

    // ВАЖНО: этот роут должен быть последним из общих!
    router.get('/', [verifyToken, isAdmin], scheduleController.getAllSchedules);

    // --- РОУТЫ ДЛЯ КОНКРЕТНОГО РАСПИСАНИЯ (с :scheduleId в пути) ---
    // Теперь Express будет правильно их отличать от /stats/overview, /generate и т.д.

    router.get('/:scheduleId', [verifyToken, isAdmin], scheduleController.getScheduleDetails);
    router.put('/:scheduleId/status', [verifyToken, isAdmin], scheduleController.updateScheduleStatus);
    router.put('/:scheduleId/update-assignments', [verifyToken, isAdmin], scheduleController.updateScheduleAssignments);
    router.post('/:scheduleId/duplicate', [verifyToken, isAdmin], scheduleController.duplicateSchedule);
    router.delete('/:scheduleId', [verifyToken, isAdmin], scheduleController.deleteSchedule);
    router.get('/:scheduleId/export', [verifyToken, isAdmin], scheduleController.exportSchedule);

    return router;
};