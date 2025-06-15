// backend/src/server.js
require('dotenv').config();
const db = require('./models');

const PORT = process.env.PORT || 5000;

// Сначала проверяем подключение к БД
db.sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected successfully');

        // Синхронизация моделей
        return db.sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('✅ Database models synchronized');

        // Только после успешной синхронизации создаем приложение
        const App = require('./app');
        const app = new App(db);

        // Запускаем сервер
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
        process.exit(1);
    });