// backend/src/routes/auth.routes.js
const express = require('express');

// Теперь наш файл экспортирует функцию
module.exports = function(db) {
    // Мы получаем db как аргумент
    const router = express.Router();
    const authController = require('../controllers/auth.controller')(db); // И передаем его дальше в контроллер

    // Authentication routes
    router.post('/register', authController.register);
    router.post('/login', authController.login);

    return router; // Возвращаем готовый роутер
};