// backend/src/routes/employee.routes.js
const express = require('express');
const {verifyToken, isAdmin} = require('../middlewares/auth.middleware');
module.exports = function (db) {
    const router = express.Router();
    const employeeController = require('../controllers/employee.controller')(db);
    const employeeRecommendationController = require('../controllers/employee-recommendation.controller')(db);


// NEW: Employee recommendations route - ДОЛЖЕН БЫТЬ ПЕРЕД /:id маршрутами!
    router.get('/recommendations', verifyToken, employeeRecommendationController.getRecommendations);

// Routes protected by JWT and requiring admin role
    router.post('/', [verifyToken, isAdmin], employeeController.create);
    router.get('/', [verifyToken, isAdmin], employeeController.findAll);
    router.get('/:id', verifyToken, employeeController.findOne);
    router.put('/:id', [verifyToken, isAdmin], employeeController.update);
    router.delete('/:id', [verifyToken, isAdmin], employeeController.delete);

// Employee constraints
    router.get('/:id/constraints', verifyToken, employeeController.getConstraints);

// Employee qualifications routes
    router.get('/:id/qualifications', verifyToken, employeeController.getQualifications);
    router.post('/:id/qualifications', [verifyToken, isAdmin], employeeController.addQualification);

    return router;
};