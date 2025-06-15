// backend/src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/test', require('./routes/test.routes'));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('SERVER ERROR:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

module.exports = app;