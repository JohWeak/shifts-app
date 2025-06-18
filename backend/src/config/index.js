// backend/src/config/weeklySchedule.js
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    db: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        // ...
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
    },
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
};