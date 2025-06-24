// backend/src/utils/dbOptimizations.js
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db.config');

// Функция для выполнения сырых запросов с оптимизацией
const executeOptimizedQuery = async (query, options = {}) => {
    const defaultOptions = {
        type: QueryTypes.SELECT,
        raw: true,
        nest: true,
        logging: false,
        benchmark: false
    };

    return sequelize.query(query, { ...defaultOptions, ...options });
};

// Функция для массовых операций
const bulkOperation = async (operation) => {
    const t = await sequelize.transaction({
        isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
        const result = await operation(t);
        await t.commit();
        return result;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

// Использование prepared statements для часто используемых запросов
const preparedQueries = {
    getActiveEmployees: `
        SELECT e.emp_id, e.first_name, e.last_name, e.phone,
               p.pos_name, w.site_name
        FROM employees e
        LEFT JOIN positions p ON e.default_position_id = p.pos_id
        LEFT JOIN work_sites w ON e.work_site_id = w.site_id
        WHERE e.status = 'active'
        ORDER BY e.first_name, e.last_name
    `,

    getEmployeesByWorkSite: `
        SELECT e.*, p.pos_name, w.site_name
        FROM employees e
        LEFT JOIN positions p ON e.default_position_id = p.pos_id
        LEFT JOIN work_sites w ON e.work_site_id = w.site_id
        WHERE (:siteId = 0 OR e.work_site_id = :siteId)
        AND e.status = :status
        LIMIT :limit OFFSET :offset
    `
};

module.exports = {
    executeOptimizedQuery,
    bulkOperation,
    preparedQueries
};