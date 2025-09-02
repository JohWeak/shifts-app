// backend/src/routes/schedule.routes.js
const express = require('express');
const {verifyToken, isAdmin, getAccessibleSites} = require('../middlewares/auth.middleware');

// Import controllers directly
const scheduleController = require('../controllers/scheduling/schedule/schedule.controller');
const generationController = require('../controllers/scheduling/schedule/schedule-generation.controller');
const employeeController = require('../controllers/scheduling/schedule/schedule-employee.controller');
const exportController = require('../controllers/scheduling/schedule/schedule-export.controller');
const ScheduleValidationController = require('../controllers/scheduling/schedule-validation.controller');

const router = express.Router();

// === EMPLOYEE ROUTES ===
router.get('/weekly', verifyToken, employeeController.getWeeklySchedule);
router.get('/position/:positionId/weekly', verifyToken, employeeController.getPositionWeeklySchedule);
router.get('/employee/archive/summary', verifyToken, employeeController.getEmployeeArchiveSummary);
router.get('/employee/archive/month', verifyToken, employeeController.getEmployeeArchiveMonth);


// === ADMIN ROUTES ===
router.get('/stats/overview', ...[verifyToken, isAdmin, getAccessibleSites], exportController.getScheduleStats);
router.get('/:scheduleId/export', ...[verifyToken, isAdmin, getAccessibleSites], exportController.exportSchedule);

router.get('/schedules/:scheduleId/statistics', ...[verifyToken, isAdmin, getAccessibleSites], scheduleController.handleGetScheduleStatistics);

router.post('/generate', ...[verifyToken, isAdmin, getAccessibleSites], generationController.generateNextWeekSchedule);
router.post('/compare-algorithms', ...[verifyToken, isAdmin, getAccessibleSites], generationController.compareAllAlgorithms);
router.get('/', ...[verifyToken, isAdmin, getAccessibleSites], scheduleController.getAllSchedules);
router.post('/:scheduleId/validate', ...[verifyToken, isAdmin, getAccessibleSites], ScheduleValidationController.validateChanges);
router.get('/:scheduleId', ...[verifyToken, isAdmin, getAccessibleSites], scheduleController.getScheduleDetails);
router.put('/:scheduleId/status', ...[verifyToken, isAdmin, getAccessibleSites], scheduleController.updateScheduleStatus);
router.put('/:scheduleId/update-assignments', ...[verifyToken, isAdmin, getAccessibleSites], scheduleController.updateScheduleAssignments);
router.delete('/:scheduleId', ...[verifyToken, isAdmin, getAccessibleSites], scheduleController.deleteSchedule);
router.get('/admin/weekly', ...[verifyToken, isAdmin, getAccessibleSites], employeeController.getAdminWeeklySchedule);


module.exports = router;