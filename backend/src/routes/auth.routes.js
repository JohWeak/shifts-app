// backend/src/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/core/auth.controller');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;