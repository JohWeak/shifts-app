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

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
        // Может понадобиться для облачных баз, чтобы соединение не обрывалось
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

module.exports = sequelize;