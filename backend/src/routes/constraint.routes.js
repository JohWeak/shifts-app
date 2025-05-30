// backend/src/routes/constraint.routes.js
const express = require('express');
const constraintController = require('../controllers/constraint.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Employee routes - all authenticated users can access
router.get('/employee/:empId', verifyToken, constraintController.getEmployeeConstraints);
router.post('/', verifyToken, constraintController.createConstraint);
router.put('/:id', verifyToken, constraintController.updateConstraint);
router.delete('/:id', verifyToken, constraintController.deleteConstraint);
// Get next week template for constraints
router.get('/next-week-template', verifyToken, constraintController.getNextWeekConstraintsTemplate);

router.get('/weekly-grid', verifyToken, constraintController.getWeeklyConstraintsGrid);
router.post('/submit-weekly', verifyToken, constraintController.submitWeeklyConstraints);

// Admin-only routes
router.get('/pending', [verifyToken, isAdmin], constraintController.getPendingConstraints);
router.put('/:id/review', [verifyToken, isAdmin], constraintController.reviewConstraint);
router.post('/permanent', [verifyToken, isAdmin], constraintController.createPermanentConstraint);

// Scheduling routes - for schedule generation
router.get('/period', verifyToken, constraintController.getConstraintsForPeriod);

module.exports = router;