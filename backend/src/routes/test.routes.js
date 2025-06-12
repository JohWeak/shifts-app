// backend/src/routes/test.routes.js
const express = require('express');
const TestController = require('../controllers/test.controller');

const router = express.Router();

router.post('/cp-sat', TestController.testCPSAT);
router.get('/recommendations', TestController.testRecommendations);
router.get('/constraints', TestController.checkConstraints);

module.exports = router;