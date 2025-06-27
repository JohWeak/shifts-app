// backend/dev-scripts/cleanup-old-shifts.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('../src/models');

async function cleanupOldShifts() {
    try {
        console.log('🧹 Cleaning up old shift references...\n');

        // 1. Проверим старые schedule_assignments со ссылками на несуществующие shifts
        const [invalidAssignments] = await db.sequelize.query(`
            SELECT COUNT(*) as count 
            FROM schedule_assignments sa
            WHERE NOT EXISTS (
                SELECT 1 FROM position_shifts ps WHERE ps.id = sa.shift_id
            )
        `);

        console.log(`Found ${invalidAssignments[0].count} assignments with invalid shift_id`);

        if (invalidAssignments[0].count > 0) {
            // Удалим их или обновим
            const [deleted] = await db.sequelize.query(`
                DELETE FROM schedule_assignments 
                WHERE shift_id NOT IN (SELECT id FROM position_shifts)
            `);
            console.log(`Deleted ${deleted.affectedRows} invalid assignments`);
        }

        // 2. Проверим, можно ли безопасно удалить таблицу shifts
        const [shiftConstraints] = await db.sequelize.query(`
            SELECT 
                TABLE_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                REFERENCED_TABLE_NAME = 'shifts'
                AND TABLE_SCHEMA = DATABASE()
        `);

        if (shiftConstraints.length > 0) {
            console.log('\n⚠️  Tables still referencing shifts table:');
            shiftConstraints.forEach(c => {
                console.log(`  - ${c.TABLE_NAME} (${c.CONSTRAINT_NAME})`);
            });
        } else {
            console.log('\n✅ No tables reference shifts table - safe to drop');
        }

        await db.sequelize.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

cleanupOldShifts();