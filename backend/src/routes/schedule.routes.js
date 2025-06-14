// backend/src/routes/schedule.routes.js
const express = require('express');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

module.exports = function (db) {
    const router = express.Router();

    // Импортируем контроллеры
    const scheduleController = require('../controllers/schedule/schedule.controller')(db);
    const generationController = require('../controllers/schedule/schedule-generation.controller')(db);
    const employeeController = require('../controllers/schedule/schedule-employee.controller')(db);
    const exportController = require('../controllers/schedule/schedule-export.controller')(db);

    // === EMPLOYEE ROUTES ===
    router.get('/weekly', verifyToken, employeeController.getWeeklySchedule);

    // === ADMIN ROUTES ===

    // Statistics and export
    router.get('/stats/overview', [verifyToken, isAdmin], exportController.getScheduleStats);
    router.get('/:scheduleId/export', [verifyToken, isAdmin], exportController.exportSchedule);

    // Recommendations
    router.get('/recommendations/employees', [verifyToken, isAdmin], scheduleController.getRecommendedEmployees);

    // Generation and comparison
    router.post('/generate', [verifyToken, isAdmin], generationController.generateNextWeekSchedule);
    router.post('/compare-algorithms', [verifyToken, isAdmin], generationController.compareAllAlgorithms);

    // CRUD operations
    router.get('/', [verifyToken, isAdmin], scheduleController.getAllSchedules);
    router.get('/:scheduleId', [verifyToken, isAdmin], scheduleController.getScheduleDetails);
    router.put('/:scheduleId/status', [verifyToken, isAdmin], scheduleController.updateScheduleStatus);
    router.put('/:scheduleId/update-assignments', [verifyToken, isAdmin], scheduleController.updateScheduleAssignments);
    router.delete('/:scheduleId', [verifyToken, isAdmin], scheduleController.deleteSchedule);

    // Admin weekly view
    router.get('/admin/weekly', [verifyToken, isAdmin], employeeController.getAdminWeeklySchedule);

    return router;
};