// backend/src/config/db.config.js

const { Sequelize } = require('sequelize');
require('dotenv').config();


// Definition of optimal parameters for Railway
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

console.log('🔍 Database Configuration:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const commonOptions = {
    dialect: 'mysql',
    pool: {
        max: isProduction ? 10 : 5,
        min: isProduction ? 2 : 1,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
        handleDisconnects: true,
    },
    logging: isDevelopment ? console.log : false,
    benchmark: isDevelopment,
    timezone: '+03:00',
};

let dbConfig;
if (process.env.DATABASE_URL) {
    // Configuration for Railway
    dbConfig = {
        ...commonOptions,
        url: process.env.DATABASE_URL,
        dialectOptions: {
            ssl: {
                require: false,
                rejectUnauthorized: false,
            },
            connectTimeout: 60000,
        },
    };
} else {
    // Local configuration
    dbConfig = {
        ...commonOptions,
        database: process.env.DB_NAME || 'shifts_db',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
    };
}

const sequelize = new Sequelize(dbConfig.url || dbConfig);

sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection has been established successfully.');
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
    });

module.exports = sequelize;

module.exports.development = dbConfig;
module.exports.test = dbConfig;
module.exports.production = dbConfig;