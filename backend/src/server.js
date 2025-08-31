// backend/src/server.js
require('dotenv').config();
const app = require('./app');
const db = require('./models');
const autoGenerationService = require('./services/scheduling/auto-generation.service');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Start server immediately.
// This ensures that the Node.js process remains active.
app.listen(PORT, HOST, async () => {
    console.log(`🚀 Server is running on http://${HOST}:${PORT}`);

    // Asynchronously check DB connection AFTER server startup.
    try {
        // sync() can be dangerous, better to use authenticate() for simple check
        await db.sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');

        // If you still need synchronization on each startup:
        // await db.sequelize.sync({ alter: false });
        // console.log('✅ Database synchronized.');

        // Here you can start your services, e.g., cron jobs
        // autoGenerationService.start();

    } catch (err) {
        console.error('❌ Unable to connect to or synchronize the database:', err);
    }
});