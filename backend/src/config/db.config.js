const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with database parameters from environment variables
// const sequelize = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//         host: process.env.DB_HOST,
//         dialect: 'mysql',
//         logging: false // Disable logging in production
//     }
// );
// Определение оптимальных параметров для Railway
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const sequelize = new Sequelize(process.env.DATABASE_URL,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',

        // Оптимизированный пул соединений
        pool: {
            max: isProduction ? 10 : 5,        // Максимум соединений (Railway обычно позволяет до 20)
            min: isProduction ? 2 : 1,         // Минимум соединений
            acquire: 30000,                     // Максимальное время ожидания соединения (30 сек)
            idle: 10000,                        // Время до закрытия неактивного соединения (10 сек)
            evict: 1000,                        // Как часто проверять неактивные соединения (1 сек)
            handleDisconnects: true,            // Автоматически восстанавливать разорванные соединения
        },

        // Оптимизация запросов
        define: {
            underscored: false,
            freezeTableName: true,
            timestamps: true
        },

        // Логирование только в development
        logging: isDevelopment ? console.log : false,

        // Опции для повышения производительности
        benchmark: isDevelopment,              // Показывать время выполнения запросов в dev

        // Настройки для SSL (если Railway требует)
        dialectOptions: isProduction ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            // Оптимизации MySQL
            connectTimeout: 60000,              // Таймаут подключения (60 сек)
            flags: ['-FOUND_ROWS'],            // Оптимизация для COUNT запросов
            decimalNumbers: true,               // Числа вместо строк для DECIMAL
            dateStrings: false,                 // Даты как объекты, не строки
            trace: false,                       // Отключить трейсинг
            multipleStatements: false,          // Безопасность
            supportBigNumbers: true,
            bigNumberStrings: false
        } : {},

        // Повторные попытки подключения
        retry: {
            max: 3,                            // Максимум попыток
            timeout: 3000,                     // Таймаут между попытками
            match: [
                /Deadlock/i,
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/,
                /ETIMEDOUT/,
                /ECONNRESET/,
                /ECONNREFUSED/
            ],
        },

        // Кэширование метаданных
        typeValidation: true,
        quoteIdentifiers: true,
    }
);

// Функция для мониторинга пула соединений
const monitorPool = () => {
    const pool = sequelize.connectionManager.pool;
    console.log('Connection Pool Status:', {
        size: pool.size,
        available: pool.available,
        using: pool.using,
        waiting: pool.waiting
    });
};

// Запускаем мониторинг в development
if (isDevelopment) {
    setInterval(monitorPool, 30000); // Каждые 30 секунд
}

// Обработка ошибок подключения
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established successfully.');
        if (isDevelopment) {
            monitorPool();
        }
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
});

module.exports = sequelize;