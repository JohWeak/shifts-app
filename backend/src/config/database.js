// backend/src/config/database.js

const {Sequelize} = require('sequelize');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.MYSQL_URL) {
    databaseUrl = process.env.MYSQL_URL;
} else if (!databaseUrl && process.env.MYSQLUSER) {
    databaseUrl = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT}/${process.env.MYSQLDATABASE}`;
}

console.log('Database URL will be used:', !!databaseUrl);
console.log('NODE_ENV:', process.env.NODE_ENV);

let sequelize;

if (databaseUrl) {
    // --- Configuration for Production (Railway) ---
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'mysql',
        pool: {max: 10, min: 2, acquire: 30000, idle: 10000},
        logging: false,
        benchmark: false,
        timezone: '+03:00',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
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
            logging: console.log,
            benchmark: true,
            timezone: '+03:00',
        }
    );
}

const cliConfig = {
    dialect: sequelize.options.dialect,
    ...sequelize.config,
    ...sequelize.options,
};

module.exports = sequelize;
module.exports.development = cliConfig;
module.exports.test = cliConfig;
module.exports.production = cliConfig;