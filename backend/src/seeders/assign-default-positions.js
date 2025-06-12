// backend/src/seeders/assign-default-positions.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
const { Employee, Position } = require('../models');

async function assignDefaultPositions() {
    try {
        console.log('Connecting to database...');

        // Проверить подключение
        await sequelize.authenticate();
        console.log('Database connection established');

        console.log('Assigning default positions to employees...');

        // Получить всех сотрудников без дефолтной позиции
        const employees = await Employee.findAll({
            where: {
                default_position_id: null,
                role: 'employee'
            }
        });

        console.log(`Found ${employees.length} employees without default positions`);

        // Получить все позиции
        const positions = await Position.findAll();
        console.log(`Found ${positions.length} positions`);

        if (positions.length === 0) {
            console.log('No positions found. Please create positions first.');
            return;
        }

        // Логика назначения позиций
        const securityPosition = positions.find(p => p.profession === 'Security');
        const receptionPosition = positions.find(p => p.profession === 'Administration');

        for (let i = 0; i < employees.length; i++) {
            const employee = employees[i];

            // Простая логика: чередуем между Security и Administration
            let assignedPosition;
            if (securityPosition && receptionPosition) {
                assignedPosition = (i % 2 === 0) ? securityPosition : receptionPosition;
            } else {
                assignedPosition = positions[i % positions.length];
            }

            await employee.update({
                default_position_id: assignedPosition.pos_id
            });

            console.log(`✓ Assigned ${employee.first_name} ${employee.last_name} to ${assignedPosition.pos_name} (${assignedPosition.profession})`);
        }

        console.log(`\n✅ Successfully updated ${employees.length} employees with default positions`);

    } catch (error) {
        console.error('❌ Error assigning default positions:', error);
    } finally {
        await sequelize.close();
    }
}

// Запустить если вызывается напрямую
if (require.main === module) {
    assignDefaultPositions().then(() => {
        console.log('Default position assignment completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = { assignDefaultPositions };