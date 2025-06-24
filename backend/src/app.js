// backend/src/app.js
const express = require('express');
const performanceMonitor = require('./middlewares/performanceMonitor');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
    app.use(performanceMonitor);
}

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Shifts API is running!' });
});

// Импортируем маршруты
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));
app.use('/api/worksites', require('./routes/worksite.routes'));
app.use('/api/positions', require('./routes/position.routes'));
app.use('/api/shifts', require('./routes/shift.routes'));
app.use('/api/constraints', require('./routes/constraint.routes'));
app.use('/api/schedule-settings', require('./routes/schedule-settings.routes'));
app.use('/api/settings', require('./routes/settings.routes'));


app.use('/api/test', require('./routes/test.routes'));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('SERVER ERROR:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// --- НАСТРОЙКА ДЛЯ ДЕПЛОЯ НА RAILWAY (добавь этот блок) ---

// 1. Подавать статические файлы из собранной папки React
// process.env.NODE_ENV === 'production' гарантирует, что это будет работать только на сервере, а не при локальной разработке
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/build')));

    // 2. "Catch-all" роут: для всех остальных запросов отдавать главный HTML-файл React
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
    });
}

module.exports = app;