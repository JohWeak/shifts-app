// backend/src/config/db.config.js

const {Sequelize} = require('sequelize');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


// Definition of optimal parameters for Railway
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';


let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    if (process.env.MYSQL_URL) {
        databaseUrl = process.env.MYSQL_URL;
    } else if (process.env.MYSQLUSER && process.env.MYSQLPASSWORD && process.env.MYSQLHOST && process.env.MYSQLPORT && process.env.MYSQLDATABASE) {
        databaseUrl = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT}/${process.env.MYSQLDATABASE}`;
    }
}
console.log('🔍 Database Configuration:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

let sequelize;

if (databaseUrl) {
    // --- Configuration for Production (Railway) ---
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'mysql',
        pool: {max: 10, min: 2, acquire: 30000, idle: 10000},
        logging: false, // Disabling SQL query logging in production
        timezone: '+03:00',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false, // A must for Railway
            },
            connectTimeout: 60000,
        },
    });
} else {
    // --- Configuration for Local Development ---
    sequelize = new Sequelize(
        process.env.DB_NAME || 'shifts_db',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            dialect: 'mysql',
            pool: {max: 5, min: 1, acquire: 30000, idle: 10000},
            logging: console.log, // Включаем логирование для отладки
            benchmark: true,
            timezone: '+03:00',
        }
    );
}

sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection has been established successfully.');
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
    });

module.exports = sequelize;

module.exports.development = sequelize.options;
module.exports.test = sequelize.options;
module.exports.production = sequelize.options;