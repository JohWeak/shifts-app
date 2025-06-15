// backend/src/controllers/test.controller.js
const db = require('../models');

const testDatabase = async (req, res) => {
    try {
        await db.sequelize.authenticate();

        // Проверяем, что модели загружены
        const modelCount = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize').length;

        res.json({
            success: true,
            message: 'Database connection successful',
            modelsLoaded: modelCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
};

const getModels = async (req, res) => {
    try {
        const models = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
        res.json({
            success: true,
            models,
            count: models.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    testDatabase,
    getModels
};