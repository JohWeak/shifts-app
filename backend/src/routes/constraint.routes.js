// backend/src/routes/constraint.routes.js
const express = require('express');
const constraintController = require('../controllers/constraint.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/employee/:empId', verifyToken, constraintController.getEmployeeConstraints);
router.post('/', verifyToken, constraintController.createConstraint);
router.put('/:id', verifyToken, constraintController.updateConstraint);
router.delete('/:id', verifyToken, constraintController.deleteConstraint);
router.get('/weekly-grid', verifyToken, constraintController.getWeeklyConstraintsGrid);
router.post('/submit-weekly', verifyToken, constraintController.submitWeeklyConstraints);
router.get('/period', verifyToken, constraintController.getConstraintsForPeriod);

module.exports = router;