// backend/dev-scripts/check-db-structure.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('../src/models');

async function checkStructure() {
    try {
        console.log('🔍 Checking database structure...\n');

        // Check if old shifts table exists
        const [shiftsTable] = await db.sequelize.query(
            "SHOW TABLES LIKE 'shifts'"
        );
        console.log('Old shifts table exists:', shiftsTable.length > 0);

        // Check position_shifts
        const [positionShifts] = await db.sequelize.query(
            "SELECT COUNT(*) as count FROM position_shifts"
        );
        console.log('Position shifts count:', positionShifts[0].count);

        // Check foreign keys on schedule_assignments
        const [foreignKeys] = await db.sequelize.query(`
            SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                TABLE_NAME = 'schedule_assignments' 
                AND TABLE_SCHEMA = DATABASE()
                AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        console.log('\nForeign keys on schedule_assignments:');
        foreignKeys.forEach(fk => {
            console.log(`- ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });

        await db.sequelize.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkStructure();