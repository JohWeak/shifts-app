// backend/src/routes/schedule.routes.js
const express = require('express');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Импортируем контроллеры напрямую
const scheduleController = require('../controllers/scheduling/schedule/schedule.controller');
const generationController = require('../controllers/scheduling/schedule/schedule-generation.controller');
const employeeController = require('../controllers/scheduling/schedule/schedule-employee.controller');
const exportController = require('../controllers/scheduling/schedule/schedule-export.controller');

const router = express.Router();

// === EMPLOYEE ROUTES ===
router.get('/weekly', verifyToken, employeeController.getWeeklySchedule);
router.get('/position/:positionId/weekly', verifyToken, employeeController.getPositionWeeklySchedule);
router.get('/employee/archive/summary', verifyToken, employeeController.getEmployeeArchiveSummary);
router.get('/employee/archive/month', verifyToken, employeeController.getEmployeeArchiveMonth);


// === ADMIN ROUTES ===
router.get('/stats/overview', ...[verifyToken, isAdmin], exportController.getScheduleStats);
router.get('/:scheduleId/export', ...[verifyToken, isAdmin], exportController.exportSchedule);

router.get('/schedules/:scheduleId/statistics', ...[verifyToken, isAdmin], scheduleController.getScheduleStatistics);
router.get('/sites/:siteId/dashboard', ...[verifyToken, isAdmin], scheduleController.getDashboardOverview);

router.post('/generate', ...[verifyToken, isAdmin], generationController.generateNextWeekSchedule);
router.post('/compare-algorithms', ...[verifyToken, isAdmin], generationController.compareAllAlgorithms);
router.get('/', ...[verifyToken, isAdmin], scheduleController.getAllSchedules);
router.get('/:scheduleId', ...[verifyToken, isAdmin], scheduleController.getScheduleDetails);
router.put('/:scheduleId/status', ...[verifyToken, isAdmin], scheduleController.updateScheduleStatus);
router.put('/:scheduleId/update-assignments', ...[verifyToken, isAdmin], scheduleController.updateScheduleAssignments);
router.delete('/:scheduleId', ...[verifyToken, isAdmin], scheduleController.deleteSchedule);
router.get('/admin/weekly', ...[verifyToken, isAdmin], employeeController.getAdminWeeklySchedule);

module.exports = router;