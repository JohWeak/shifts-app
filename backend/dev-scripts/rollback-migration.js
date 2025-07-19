// backend/dev-scripts/rollback-migration.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../src/config/db.config');

async function rollbackLastMigration() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('🔄 Rolling back last migration...\n');

        // Get last executed migration
        const [lastMigration] = await sequelize.query(
            'SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1'
        );

        if (!lastMigration || lastMigration.length === 0) {
            console.log('No migrations to rollback');
            return;
        }

        const migrationName = lastMigration[0].name;
        console.log(`Rolling back: ${migrationName}`);

        // Load and run down method
        const migrationPath = path.join(__dirname, '../src/migrations', migrationName);
        const migration = require(migrationPath);

        if (migration.down) {
            await migration.down(queryInterface, sequelize.Sequelize);

            // Remove from migrations table
            await sequelize.query(
                'DELETE FROM migrations WHERE name = ?',
                { replacements: [migrationName] }
            );

            console.log(`✅ Rollback completed for ${migrationName}`);
        } else {
            console.log(`⚠️  No down method found for ${migrationName}`);
        }

    } catch (error) {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    rollbackLastMigration();
}

module.exports = rollbackLastMigration;