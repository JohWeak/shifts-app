// backend/src/app.js
const express = require('express');
const performanceMonitor = require('./middlewares/performanceMonitor');
const cors = require('cors');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const db = require('./models');
const app = express();

app.set('db', db);


// Middleware
// --- CORS settings for local development ---
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    `http://172.20.10.2:3000`,
    `http://192.168.1.111:3000`,
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

if (process.env.NODE_ENV === 'development') {
    app.use(performanceMonitor);
}

// Routes
app.get('/', (req, res) => {
    res.json({message: 'Shifts API is running!'});
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));
app.use('/api/worksites', require('./routes/worksite.routes'));
app.use('/api/constraints', require('./routes/constraint.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

const {positionRouter, shiftRouter, requirementRouter} = require('./routes/position.routes');

app.use('/api/positions', positionRouter);
app.use('/api/shifts', shiftRouter);
app.use('/api/requirements', requirementRouter);

app.use((error, req, res, _next) => {
    console.error('SERVER ERROR:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
});

// --- RAILWAY DEPLOYMENT SETTINGS ---

// 1. Submit static files from the collected react folder
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/build')));

// 2. "Catch-all" Rout: for all other requests, give the main HTML file React
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
    });
}

module.exports = app;