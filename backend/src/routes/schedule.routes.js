const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Временный обработчик для тестирования
router.get('/', verifyToken, (req, res) => {
    res.json({ message: 'Schedule API is working' });
});

// Здесь будут реальные маршруты для работы с расписаниями

module.exports = router;