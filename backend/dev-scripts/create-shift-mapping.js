// backend/dev-scripts/create-shift-mapping.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('../src/models');

async function createShiftMapping() {
    try {
        console.log('🔍 Creating shift mapping...\n');

        // Получаем старые shifts
        const [oldShifts] = await db.sequelize.query(
            "SELECT shift_id, shift_name, start_time FROM shifts ORDER BY shift_id"
        );
        console.log('Old shifts:', oldShifts);

        // Получаем новые position_shifts
        const [positionShifts] = await db.sequelize.query(
            "SELECT id, shift_name, start_time, position_id FROM position_shifts ORDER BY id"
        );
        console.log('\nPosition shifts:', positionShifts);

        // Создаем маппинг на основе названия и времени
        const mapping = {};

        oldShifts.forEach(oldShift => {
            // Ищем соответствующую смену в position_shifts
            const match = positionShifts.find(ps =>
                ps.shift_name === oldShift.shift_name &&
                ps.start_time === oldShift.start_time
            );

            if (match) {
                mapping[oldShift.shift_id] = match.id;
                console.log(`\nMapping: old shift ${oldShift.shift_id} (${oldShift.shift_name}) -> position_shift ${match.id}`);
            } else {
                console.log(`\nWARNING: No match found for old shift ${oldShift.shift_id} (${oldShift.shift_name})`);
            }
        });

        console.log('\nFinal mapping:', mapping);

        // Сохраняем маппинг в файл для использования в коде
        const fs = require('fs').promises;
        await fs.writeFile(
            path.join(__dirname, 'shift-mapping.json'),
            JSON.stringify(mapping, null, 2)
        );

        console.log('\nMapping saved to shift-mapping.json');

        await db.sequelize.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

createShiftMapping();