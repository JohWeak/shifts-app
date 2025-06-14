// backend/src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

class App {
    constructor(db) {
        if (!db) {
            throw new Error("Application requires a database object.");
        }
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
        // Импортируем и вызываем функции роутов, передавая им this.db
        const authRoutes = require('./routes/auth.routes')(this.db);
        const employeeRoutes = require('./routes/employee.routes')(this.db);
        const scheduleRoutes = require('./routes/schedule.routes')(this.db);
        // ... и все остальные роуты ...
        const worksiteRoutes = require('./routes/worksite.routes')(this.db);
        const positionRoutes = require('./routes/position.routes')(this.db);
        const shiftRoutes = require('./routes/shift.routes')(this.db);
        const constraintRoutes = require('./routes/constraint.routes')(this.db);
        const scheduleSettingsRoutes = require('./routes/schedule-settings.routes')(this.db);
        const testRoutes = require('./routes/test.routes')(this.db);

        this.app.get('/', (req, res) => {
            res.json({ message: 'Shifts API is running!' });
        });

        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/employees', employeeRoutes);
        this.app.use('/api/schedules', scheduleRoutes);
        // ... регистрация всех остальных роутов ...
        this.app.use('/api/worksites', worksiteRoutes);
        this.app.use('/api/positions', positionRoutes);
        this.app.use('/api/shifts', shiftRoutes);
        this.app.use('/api/constraints', constraintRoutes);
        this.app.use('/api/schedule-settings', scheduleSettingsRoutes);
        this.app.use('/api/test', testRoutes);
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