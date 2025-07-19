// backend/dev-scripts/run-all-migrations.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../src/config/db.config');
const fs = require('fs');

async function runAllMigrations() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('🚀 Starting database migrations...\n');

        // Create migrations tracking table if not exists
        await queryInterface.createTable('migrations', {
            name: {
                type: 'VARCHAR(255)',
                primaryKey: true
            },
            executed_at: {
                type: 'TIMESTAMP',
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
            }
        }).catch(() => {
            console.log('Migrations table already exists');
        });

        // Get list of executed migrations
        const [executedMigrations] = await sequelize.query(
            'SELECT name FROM migrations'
        );
        const executed = executedMigrations.map(m => m.name);

        // Get all migration files
        const migrationsPath = path.join(__dirname, '../src/migrations');
        const migrationFiles = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.js'))
            .sort();

        // Run migrations
        for (const file of migrationFiles) {
            if (executed.includes(file)) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`▶️  Running migration: ${file}`);

            try {
                const migration = require(path.join(migrationsPath, file));
                await migration.up(queryInterface, sequelize.Sequelize);

                // Mark as executed
                await sequelize.query(
                    'INSERT INTO migrations (name) VALUES (?)',
                    { replacements: [file] }
                );

                console.log(`✅ ${file} completed\n`);
            } catch (error) {
                console.error(`❌ ${file} failed:`, error.message);
                throw error;
            }
        }

        console.log('✅ All migrations completed successfully!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    runAllMigrations();
}

module.exports = runAllMigrations;