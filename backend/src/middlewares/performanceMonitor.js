// backend/src/middleware/performanceMonitor.js
const onFinished = require('on-finished');
const sequelize = require('../config/db.config');

const performanceMonitor = (req, res, next) => {
    const start = Date.now();

    if (process.env.NODE_ENV === 'development') {
        const originalLogging = sequelize.options.logging;
        const queries = [];

        sequelize.options.logging = (sql, timing) => {
            queries.push({ sql, timing });
            if (originalLogging) {
                originalLogging(sql, timing);
            }
        };

        onFinished(res, () => {
            sequelize.options.logging = originalLogging;
            const duration = Date.now() - start;

            if (duration > 1000) {
                console.warn(`⚠️  Slow request: ${req.method} ${req.url}`);
                console.warn(`   Duration: ${duration}ms`);
                console.warn(`   Queries: ${queries.length}`);

                queries.forEach((q, i) => {
                    if (q.timing > 100) {
                        console.warn(`   Query ${i + 1}: ${q.timing}ms`);
                        console.warn(`   ${q.sql.substring(0, 100)}...`);
                    }
                });
            }
        });
    }

    next();
};

module.exports = performanceMonitor;