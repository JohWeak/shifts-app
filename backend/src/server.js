// backend/src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. Инициализируем модели - это должно быть первым!
const db = require('./models');
const sequelize = db.sequelize;

// 2. Создаем приложение Express
const app = express();

// 3. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. ИМПОРТИРУЕМ и СРАЗУ ВЫЗЫВАЕМ функции роутов, передавая им db
const authRoutes = require('./routes/auth.routes')(db);
const employeeRoutes = require('./routes/employee.routes')(db);
const worksiteRoutes = require('./routes/worksite.routes')(db);
const positionRoutes = require('./routes/position.routes')(db);
const shiftRoutes = require('./routes/shift.routes')(db);
const constraintRoutes = require('./routes/constraint.routes')(db);
const scheduleSettingsRoutes = require('./routes/schedule-settings.routes')(db);
const scheduleRoutes = require('./routes/schedule.routes')(db);
const testRoutes = require('./routes/test.routes')(db);


// 5. Регистрируем готовые роутеры в приложении
app.get('/', (req, res) => {
    res.json({ message: 'Shifts API is alive and well!' });
});
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/worksites', worksiteRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/constraints', constraintRoutes);
app.use('/api/schedule-settings', scheduleSettingsRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/test', testRoutes);

// 6. Error handling middleware
app.use((error, req, res, next) => {
    console.error('SERVER ERROR:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 7. Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode - using migrations for DB schema.');
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
});