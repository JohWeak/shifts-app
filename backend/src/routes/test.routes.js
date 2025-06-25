// backend/src/routes/test.routes.js
const express = require('express');
const testController = require('../controllers/core/test.controller');

const router = express.Router();

router.get('/db', testController.testDatabase);
router.get('/models', testController.getModels);

module.exports = router;