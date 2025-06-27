// backend/dev-scripts/migrate-employee-constraints.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('../src/models');

async function migrateEmployeeConstraints() {
    try {
        console.log('🔄 Migrating employee constraints...\n');

        // Проверим constraints с shift_id
        const [constraints] = await db.sequelize.query(`
            SELECT 
                ec.id,
                ec.emp_id,
                ec.shift_id,
                s.shift_name as old_shift_name,
                s.start_time as old_start_time
            FROM employee_constraints ec
            LEFT JOIN shifts s ON ec.shift_id = s.shift_id
            WHERE ec.shift_id IS NOT NULL
        `);

        console.log(`Found ${constraints.length} constraints with shift references`);

        if (constraints.length > 0) {
            // Попробуем найти соответствие в position_shifts
            for (const constraint of constraints) {
                if (constraint.old_shift_name) {
                    // Ищем похожую смену в position_shifts
                    const [matches] = await db.sequelize.query(`
                        SELECT id, shift_name, position_id 
                        FROM position_shifts 
                        WHERE shift_name LIKE '%${constraint.old_shift_name.replace('Shift', '').trim()}%'
                        LIMIT 1
                    `);

                    if (matches.length > 0) {
                        console.log(`Mapping constraint ${constraint.id}: shift ${constraint.shift_id} -> position_shift ${matches[0].id}`);

                        // Обновляем constraint
                        await db.sequelize.query(`
                            UPDATE employee_constraints 
                            SET shift_id = ${matches[0].id} 
                            WHERE id = ${constraint.id}
                        `);
                    } else {
                        console.log(`No match found for constraint ${constraint.id} (${constraint.old_shift_name})`);

                        // Обнуляем shift_id если не нашли соответствие
                        await db.sequelize.query(`
                            UPDATE employee_constraints 
                            SET shift_id = NULL 
                            WHERE id = ${constraint.id}
                        `);
                    }
                }
            }
        }

        // Проверяем результат
        const [invalidConstraints] = await db.sequelize.query(`
            SELECT COUNT(*) as count 
            FROM employee_constraints 
            WHERE shift_id IS NOT NULL 
            AND shift_id NOT IN (SELECT id FROM position_shifts)
        `);

        console.log(`\nRemaining invalid constraints: ${invalidConstraints[0].count}`);

        await db.sequelize.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

migrateEmployeeConstraints();