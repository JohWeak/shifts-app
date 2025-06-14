// backend/src/controllers/test.controller.js
const db = require('../models');

const testDatabase = async (req, res) => {
    try {
        await db.sequelize.authenticate();
        res.json({ success: true, message: 'Database connection successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
    }
};

const getModels = async (req, res) => {
    try {
        const models = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
        res.json({ success: true, models });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    testDatabase,
    getModels
};