const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Model import
const db = require('./models');
const sequelize = require('./config/db.config');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route import
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const scheduleRoutes = require('./routes/schedule.routes');

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/schedules', scheduleRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Shifts application API.' });
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}.`);

    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Синхронизация моделей с базой данных
        await sequelize.sync({ alter: true });
        console.log('Database synchronized');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});