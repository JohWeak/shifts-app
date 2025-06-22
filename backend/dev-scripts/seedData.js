const {
    WorkSite,
    Position,
    Shift
} = require('../src/models');
const sequelize = require('../src/config/db.config');
require('dotenv').config();

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Creating a test work object
        const workSite = await WorkSite.findOrCreate({
            where: { site_name: 'Main Office' },
            defaults: {
                site_name: 'Main Office'
            }
        });

        console.log('WorkSite created/found:', workSite[0].site_id);

        // Creating test items
        const positions = await Position.bulkCreate([
            {
                pos_name: 'Security Guard',
                profession: 'Security',
                num_of_emp: 1,
                num_of_shifts: 3,
                site_id: workSite[0].site_id
            },
            {
                pos_name: 'Receptionist',
                profession: 'Administration',
                num_of_emp: 1,
                num_of_shifts: 2,
                site_id: workSite[0].site_id
            }
        ], { ignoreDuplicates: true });

        console.log('Positions created:', positions.length);

        // Создание тестовых смен
        const shifts = await Shift.bulkCreate([
            {
                shift_name: 'Morning Shift',
                duration: 8,
                start_time: '08:00:00'
            },
            {
                shift_name: 'Evening Shift',
                duration: 8,
                start_time: '16:00:00'
            },
            {
                shift_name: 'Night Shift',
                duration: 8,
                start_time: '00:00:00'
            }
        ], { ignoreDuplicates: true });

        console.log('Shifts created:', shifts.length);

        console.log('Seed data completed successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await sequelize.close();
    }
}

seedData();