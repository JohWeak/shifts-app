// backend/src/scripts/clear-sequelize-cache.js (исправленная версия)
async function clearCache() {
    try {
        console.log('🔄 Testing database connection with fresh models...');

        // Требуем модели заново, чтобы обновить их определения
        delete require.cache[require.resolve('../models/associations')];
        delete require.cache[require.resolve('../models/scheduling/shift.model')];
        delete require.cache[require.resolve('../config/db.config')];

        // Загружаем заново
        const sequelize = require('../config/db.config');
        const { Shift, Employee } = require('../models/associations');

        // Тестируем соединение
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Тестируем модель Shift
        const shiftsCount = await Shift.count();
        console.log(`✅ Found ${shiftsCount} shifts in database`);

        // Тестируем модель Employee
        const employeesCount = await Employee.count();
        console.log(`✅ Found ${employeesCount} employees in database`);

        await sequelize.close();
        console.log('✅ Test completed successfully');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

clearCache()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script error:', error);
        process.exit(1);
    });