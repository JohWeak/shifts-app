// backend/src/routes/employee.routes.js
const express = require('express');
const employeeController = require('../controllers/core/employee.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');
const EmployeeRecommendationController = require('../controllers/scheduling/employee-recommendation.controller');

const router = express.Router();

// Employee recommendations route - ПЕРЕД /:id маршрутами!
router.get('/recommendations', verifyToken, EmployeeRecommendationController.getRecommendations);

// Routes protected by JWT and requiring admin role
router.post('/', ...[verifyToken, isAdmin], employeeController.create);
router.get('/', ...[verifyToken, isAdmin], employeeController.findAll);
router.get('/:id', verifyToken, employeeController.findOne);
router.put('/:id', ...[verifyToken, isAdmin], employeeController.update);
router.delete('/:id', ...[verifyToken, isAdmin], employeeController.delete);

// Employee constraints
router.get('/:id/constraints', verifyToken, employeeController.getConstraints);

// Employee qualifications routes
router.get('/:id/qualifications', verifyToken, employeeController.getQualifications);
router.post('/:id/qualifications', ...[verifyToken, isAdmin], employeeController.addQualification);

module.exports = router;