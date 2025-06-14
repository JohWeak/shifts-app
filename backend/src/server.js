// backend/src/server.js
process.on('unhandledRejection', (reason, promise) => {
    console.error('!!!!!! UNHANDLED REJECTION !!!!!!');
    console.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('!!!!!! UNCAUGHT EXCEPTION !!!!!!');
    console.error('Error:', error);
    process.exit(1); // Завершаем процесс после критической ошибки
});

const App = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 5000;

// Создаем экземпляр приложения, передавая ему готовый объект db
const application = new App(db);

// Функция для запуска сервера
async function startServer() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        application.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            if (process.env.NODE_ENV === 'development') {
                console.log('🔧 Development mode - using migrations for DB schema.');
            }
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database or start server:', error);
        process.exit(1);
    }
}

startServer();