// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/db.config');

const db = {};
const sequelize = config.sequelize;

// Автоматическая загрузка моделей
['core', 'scheduling', 'constraints'].forEach(folder => {
    fs.readdirSync(path.join(__dirname, folder))
        .filter(file => file.endsWith('.model.js'))
        .forEach(file => {
            const model = require(path.join(__dirname, folder, file));
            db[model.name] = model;
        });
});

// Инициализация ассоциаций
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;