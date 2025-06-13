// backend/src/scripts/seedScheduleData.js - Production version
const sequelize = require('../config/db.config');
const { Schedule, ScheduleAssignment, Employee, Shift, Position, WorkSite } = require('../models/associations');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Configure Day.js
dayjs.extend(utc);
dayjs.extend(timezone);

// Set locale to start week on Sunday
dayjs.locale({
    ...dayjs.Ls.en,
    weekStart: 0 // 0 = Sunday, 1 = Monday
});

const ISRAEL_TIMEZONE = 'Asia/Jerusalem';
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Calculate current week in Israel timezone
 */
function getCurrentWeekBounds() {
    const now = dayjs().tz(ISRAEL_TIMEZONE);

    // Manual calculation for Sunday start
    const dayOfWeek = now.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const daysToSubtract = dayOfWeek;

    const weekStart = now.subtract(daysToSubtract, 'day').startOf('day');
    const weekEnd = weekStart.add(6, 'day').endOf('day');

    console.log(`Debug: Today is ${now.format('dddd')} (day ${dayOfWeek})`);
    console.log(`Debug: Subtracting ${daysToSubtract} days to get Sunday`);
    console.log(`Debug: Week start: ${weekStart.format('dddd YYYY-MM-DD')}`);
    console.log(`Debug: Week end: ${weekEnd.format('dddd YYYY-MM-DD')}`);

    return {
        weekStart,
        weekEnd,
        weekStartStr: weekStart.format(DATE_FORMAT),
        weekEndStr: weekEnd.format(DATE_FORMAT)
    };
}

async function clearOldData() {
    console.log('🧹 Clearing old schedule data...');
    await ScheduleAssignment.destroy({ where: {} });
    await Schedule.destroy({ where: {} });
    console.log('✅ Old schedule data cleared');
}

async function createCorrectShifts() {
    console.log('⚙️ Creating correct shifts...');

    // Delete existing shifts first
    await Shift.destroy({ where: {} });

    // Create the 3 required shifts
    const shifts = await Shift.bulkCreate([
        {
            shift_name: 'Morning Shift',
            duration: 8,
            start_time: '06:00:00',
            shift_type: 'morning',
            is_night_shift: false,
            emp_id: null
        },
        {
            shift_name: 'Day Shift',
            duration: 8,
            start_time: '14:00:00',
            shift_type: 'day',
            is_night_shift: false,
            emp_id: null
        },
        {
            shift_name: 'Night Shift',
            duration: 8,
            start_time: '22:00:00',
            shift_type: 'night',
            is_night_shift: true,
            emp_id: null
        }
    ]);

    console.log(`✅ Created ${shifts.length} shifts with proper Israel timezone handling`);
    return shifts;
}

async function seedScheduleData() {
    try {
        console.log('🚀 Starting production-ready schedule data seeding...');

        // Clear old data and create correct shifts
        await clearOldData();
        const shifts = await createCorrectShifts();

        // Calculate current week in Israel timezone
        const { weekStart, weekEnd, weekStartStr, weekEndStr } = getCurrentWeekBounds();

        console.log(`📅 Creating schedule for Israel timezone week:`);
        console.log(`   Start: ${weekStart.format('dddd, MMMM D, YYYY')} (${weekStartStr})`);
        console.log(`   End: ${weekEnd.format('dddd, MMMM D, YYYY')} (${weekEndStr})`);
        console.log(`   Current time: ${dayjs().tz(ISRAEL_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')} Israel time`);

        // Validate entities
        const workSite = await WorkSite.findOne();
        if (!workSite) {
            throw new Error('No work site found. Please create a work site first.');
        }

        const employees = await Employee.findAll({
            where: { status: 'active' },
            limit: 7
        });
        if (employees.length === 0) {
            throw new Error('No active employees found. Please create employees first.');
        }

        const positions = await Position.findAll();
        if (positions.length === 0) {
            throw new Error('No positions found. Please create positions first.');
        }

        console.log(`👥 Found: ${employees.length} employees, ${shifts.length} shifts, ${positions.length} positions`);

        // Create schedule record
        const schedule = await Schedule.create({
            start_date: weekStartStr,
            end_date: weekEndStr,
            status: 'published',
            site_id: workSite.site_id,
            text_file: JSON.stringify({
                generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString(),
                algorithm: 'production_seed',
                timezone: ISRAEL_TIMEZONE,
                structure: {
                    shifts_per_day: 3,
                    employees_per_shift: 1,
                    shifts: [
                        { name: 'Morning', time: '06:00-14:00', type: 'morning' },
                        { name: 'Day', time: '14:00-22:00', type: 'day' },
                        { name: 'Night', time: '22:00-06:00', type: 'night' }
                    ]
                },
                week_info: {
                    start_day: weekStart.format('dddd'),
                    end_day: weekEnd.format('dddd'),
                    israel_timezone: true
                }
            })
        });

        console.log(`📋 Created schedule with ID: ${schedule.id}`);

        // Create assignments: 1 employee per shift, 3 shifts per day, 7 days
        const assignments = [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const workDay = weekStart.add(dayIndex, 'day');
            const workDateStr = workDay.format(DATE_FORMAT);
            const dayName = dayNames[workDay.day()];

            console.log(`📝 Creating assignments for ${dayName} (${workDateStr})`);

            // Create assignment for each shift
            for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex++) {
                const shift = shifts[shiftIndex];

                // Use round-robin to distribute employees
                const employeeIndex = (dayIndex * 3 + shiftIndex) % employees.length;
                const employee = employees[employeeIndex];
                const position = positions[0]; // Use first position

                assignments.push({
                    schedule_id: schedule.id,
                    emp_id: employee.emp_id,
                    shift_id: shift.shift_id,
                    position_id: position.pos_id,
                    work_date: workDateStr,
                    status: 'scheduled',
                    notes: `${shift.shift_name} on ${dayName} - Generated by production seeder`
                });

                console.log(`   ⚡ ${shift.shift_name}: ${employee.first_name} ${employee.last_name}`);
            }
        }

        // Bulk create assignments
        await ScheduleAssignment.bulkCreate(assignments);
        console.log(`✅ Created ${assignments.length} assignments (7 days × 3 shifts × 1 employee)`);

        console.log('\n🎉 Production schedule data seeded successfully!');
        console.log('\n📊 Schedule structure:');
        console.log('   📅 Week: Sunday to Saturday (Israel timezone)');
        console.log('   🕰️  Shifts: Morning (6:00-14:00), Day (14:00-22:00), Night (22:00-6:00)');
        console.log('   👤 Assignment: 1 employee per shift');
        console.log('   🌍 Timezone: Asia/Jerusalem (handles DST automatically)');
        console.log('\n🔗 Test the API:');
        console.log('   GET http://localhost:5000/api/schedules/weekly');

    } catch (error) {
        console.error('❌ Error seeding schedule data:', error);
        throw error;
    } finally {
        console.log('🏁 Seeding process complete');
    }
}

// Run the seeder
if (require.main === module) {
    seedScheduleData().then(() => {
        sequelize.close();
        process.exit(0);
    }).catch((error) => {
        console.error('Fatal error:', error);
        sequelize.close();
        process.exit(1);
    });
}

module.exports = seedScheduleData;