// backend/src/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const sequelize = require('./config/db.config');
// Import all models and their associations
require('./models/associations');

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
const constraintRoutes = require('./routes/constraint.routes'); // NEW
const scheduleSettingsRoutes = require('./routes/schedule-settings.routes'); // NEW
const scheduleRoutes = require('./routes/schedule.routes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/worksites', worksiteRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/constraints', constraintRoutes); // NEW
app.use('/api/schedule-settings', scheduleSettingsRoutes); // NEW


app.use('/api/schedules', scheduleRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Shifts application API.' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}.`);

    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // ONLY for development
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ force: false });
            console.log('Development mode - skipping auto-sync');
        }

        // For production, will use migrations:
        // npx sequelize-cli db:migrate

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});

