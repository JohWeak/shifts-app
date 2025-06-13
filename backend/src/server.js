// backend/src/server.js (обновленная версия)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./models');
const sequelize = db.sequelize;

const app = express();
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Import routes
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const worksiteRoutes = require('./routes/worksite.routes');
const positionRoutes = require('./routes/position.routes');
const shiftRoutes = require('./routes/shift.routes');
const constraintRoutes = require('./routes/constraint.routes');
const scheduleSettingsRoutes = require('./routes/schedule-settings.routes');
const scheduleRoutes = require('./routes/schedule.routes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/worksites', worksiteRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/constraints', constraintRoutes);
app.use('/api/schedule-settings', scheduleSettingsRoutes);
app.use('/api/schedules', scheduleRoutes);


// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');

        // ONLY for development - не синхронизируем, так как используем миграции
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode - using migrations instead of auto-sync');
        }

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
});