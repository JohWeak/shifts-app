// backend/src/routes/test.routes.js
const express = require('express');

module.exports = function(db) {
    const router = express.Router();
    // Создаем экземпляр контроллера
    const testController = require('../controllers/test.controller')(db);

    router.post('/cp-sat', testController.testCPSAT);
    router.get('/recommendations', testController.testRecommendations);
    router.get('/constraints', testController.checkConstraints);

    return router;
};