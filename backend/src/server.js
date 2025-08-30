// backend/src/server.js
require('dotenv').config();
const app = require('./app');
const db = require('./models');
const autoGenerationService = require('./services/scheduling/auto-generation.service');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

db.sequelize.sync({alter: false})
    .then(() => {
        console.log('✅ Database connected and synchronized');

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err);
    });