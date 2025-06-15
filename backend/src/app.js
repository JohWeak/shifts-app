// backend/src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

class App {
    constructor(db) {
        this.db = db;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.json({ message: 'Shifts API is running!' });
        });

        // Маршруты без необходимости в db
        this.app.use('/api/auth', require('./routes/auth.routes'));
        this.app.use('/api/employees', require('./routes/employee.routes'));
        this.app.use('/api/schedules', require('./routes/schedule.routes'));
        this.app.use('/api/worksites', require('./routes/worksite.routes'));
        this.app.use('/api/positions', require('./routes/position.routes'));
        this.app.use('/api/shifts', require('./routes/shift.routes'));
        this.app.use('/api/constraints', require('./routes/constraint.routes'));
        this.app.use('/api/schedule-settings', require('./routes/schedule-settings.routes'));
        this.app.use('/api/test', require('./routes/test.routes'));
    }

    setupErrorHandlers() {
        this.app.use((error, req, res, next) => {
            console.error('SERVER ERROR:', error);
            res.status(500).json({
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }

    listen(port, callback) {
        this.app.listen(port, callback);
    }
}

module.exports = App;