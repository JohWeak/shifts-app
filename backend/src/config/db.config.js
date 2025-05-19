const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with database parameters from environment variables
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false // Disable logging in production
    }
);

module.exports = sequelize;