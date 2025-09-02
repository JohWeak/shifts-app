// backend/src/routes/employee.routes.js
const express = require('express');
const employeeController = require('../controllers/core/employee.controller');
const { verifyToken, isAdmin, getAccessibleSites, isSuperAdmin } = require('../middlewares/auth.middleware');
const EmployeeRecommendationController = require('../controllers/scheduling/employee-recommendation.controller');

const router = express.Router();

router.get('/my-shifts', verifyToken, employeeController.getMyShifts);

// Employee recommendations route
router.get('/recommendations', verifyToken, EmployeeRecommendationController.getRecommendations);
router.post('/recommendations', verifyToken, EmployeeRecommendationController.getRecommendations);

// Profile routes
router.get('/profile', verifyToken, employeeController.getProfile);
router.put('/profile', verifyToken, employeeController.updateProfile);

// Routes protected by JWT and requiring admin role
router.post('/', ...[verifyToken, isSuperAdmin], employeeController.create); // Only super admins can create employees (admins)
router.get('/', ...[verifyToken, isAdmin, getAccessibleSites], employeeController.findAll); // Filter by accessible sites
router.get('/:id', verifyToken, employeeController.findOne);
router.put('/:id', ...[verifyToken, isAdmin], employeeController.update);
router.delete('/:id', ...[verifyToken, isAdmin], employeeController.delete);

// Employee constraints
router.get('/:id/constraints', verifyToken, employeeController.getConstraints);

// Employee qualifications routes
router.get('/:id/qualifications', verifyToken, employeeController.getQualifications);
router.post('/:id/qualifications', ...[verifyToken, isAdmin], employeeController.addQualification);


module.exports = router;