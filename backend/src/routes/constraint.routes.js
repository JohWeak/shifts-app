// backend/src/routes/constraint.routes.js (исправленная версия)
const express = require('express');
const {verifyToken, isAdmin} = require('../middlewares/auth.middleware');

module.exports = function (db) {
    const router = express.Router();
    const constraintController = require('../controllers/constraint.controller')(db);

// Employee routes - all authenticated users can access
    router.get('/employee/:empId', verifyToken, constraintController.getEmployeeConstraints);
    router.post('/', verifyToken, constraintController.createConstraint);
    router.put('/:id', verifyToken, constraintController.updateConstraint);
    router.delete('/:id', verifyToken, constraintController.deleteConstraint);

// NEW ROUTES (основные для работы)
    router.get('/weekly-grid', verifyToken, constraintController.getWeeklyConstraintsGrid);
    router.post('/submit-weekly', verifyToken, constraintController.submitWeeklyConstraints);

// УДАЛЯЕМ СТАРЫЙ РОУТ - он больше не нужен
// router.get('/next-week-template', verifyToken, constraintController.getNextWeekConstraintsTemplate);

// Admin-only routes (временно закомментируем пока не нужны)
// router.get('/pending', [verifyToken, isAdmin], constraintController.getPendingConstraints);
// router.put('/:id/review', [verifyToken, isAdmin], constraintController.reviewConstraint);
// router.post('/permanent', [verifyToken, isAdmin], constraintController.createPermanentConstraint);

// Scheduling routes - for schedule generation
    router.get('/period', verifyToken, constraintController.getConstraintsForPeriod);

    return router;
};