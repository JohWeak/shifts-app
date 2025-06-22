// backend/src/scripts/run-migration.js
const sequelize = require('../src/config/db.config');
const migration = require('../src/migrations/001-simplify-constraints');

async function runMigration() {
    try {
        console.log('🚀 Starting database migration...');

        // Создаем backup перед миграцией
        console.log('📋 Creating backup...');

        await migration.up(sequelize.getQueryInterface(), sequelize);

        console.log('✅ Migration completed successfully!');
        console.log('🔧 Please update your controllers to use EmployeeConstraint model');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('🔄 Running rollback...');

        try {
            await migration.down(sequelize.getQueryInterface(), sequelize);
            console.log('✅ Rollback completed');
        } catch (rollbackError) {
            console.error('❌ Rollback failed:', rollbackError);
        }
    } finally {
        await sequelize.close();
    }
}

runMigration();