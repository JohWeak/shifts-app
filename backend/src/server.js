// backend/src/server.js
require('dotenv').config();
const app = require('./app');
const db = require('./models');
const autoGenerationService = require('./services/scheduling/auto-generation.service');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Запускаем сервер немедленно.
// Это гарантирует, что Node.js процесс останется активным.
app.listen(PORT, HOST, async () => {
    console.log(`🚀 Server is running on http://${HOST}:${PORT}`);

    // Асинхронно проверяем соединение с БД уже ПОСЛЕ запуска сервера.
    try {
        // sync() может быть опасен, лучше использовать authenticate() для простой проверки
        await db.sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');

        // Если вам все же нужна синхронизация при каждом запуске:
        // await db.sequelize.sync({ alter: false });
        // console.log('✅ Database synchronized.');

        // Здесь можно запустить ваши сервисы, например, cron jobs
        // autoGenerationService.start();

    } catch (err) {
        console.error('❌ Unable to connect to or synchronize the database:', err);
    }
});