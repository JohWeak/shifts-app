// backend/src/scripts/test-all-algorithms.js
const AdvancedScheduler = require('../services/advanced-scheduler.service');
const ScheduleGeneratorService = require('../services/schedule-generator.service');
const dayjs = require('dayjs');

async function testAllAlgorithms() {
    try {
        console.log('🧪 Testing All Available Scheduling Algorithms\n');

        const siteId = 1;
        const weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');

        console.log(`📅 Testing for site ${siteId}, week starting ${weekStart}\n`);

        // Тест 1: Advanced Scheduler
        console.log('🤖 Testing Advanced Scheduler...');
        const advancedStart = Date.now();
        const advancedResult = await AdvancedScheduler.generateOptimalSchedule(siteId, weekStart);
        const advancedTime = Date.now() - advancedStart;

        console.log(`   Result: ${advancedResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Time: ${advancedTime}ms`);
        if (advancedResult.success) {
            console.log(`   Assignments: ${advancedResult.schedule.assignments_count}`);
            console.log(`   Score: ${advancedResult.stats?.score || 'N/A'}`);
            console.log(`   Iterations: ${advancedResult.iterations || 'N/A'}`);
        } else {
            console.log(`   Error: ${advancedResult.error}`);
        }

        console.log('');

        // Тест 2: Simple Scheduler
        console.log('🧠 Testing Simple Scheduler...');
        const simpleStart = Date.now();
        const simpleResult = await ScheduleGeneratorService.generateWeeklySchedule(siteId, weekStart);
        const simpleTime = Date.now() - simpleStart;

        console.log(`   Result: ${simpleResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Time: ${simpleTime}ms`);
        if (simpleResult.success) {
            console.log(`   Assignments: ${simpleResult.schedule.assignments_count}`);
            console.log(`   Employees: ${simpleResult.stats?.employees_assigned || 'N/A'}`);
        } else {
            console.log(`   Error: ${simpleResult.error}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 COMPARISON SUMMARY:');
        console.log('='.repeat(50));

        // Сравнение результатов
        if (advancedResult.success && simpleResult.success) {
            console.log('🏆 Both algorithms succeeded!');

            const advancedAssignments = advancedResult.schedule.assignments_count;
            const simpleAssignments = simpleResult.schedule.assignments_count;

            console.log(`📈 Assignments - Advanced: ${advancedAssignments}, Simple: ${simpleAssignments}`);
            console.log(`⏱️ Speed - Advanced: ${advancedTime}ms, Simple: ${simpleTime}ms`);

            if (advancedAssignments > simpleAssignments) {
                console.log('🥇 Winner: Advanced Scheduler (better coverage)');
            } else if (simpleAssignments > advancedAssignments) {
                console.log('🥇 Winner: Simple Scheduler (better coverage)');
            } else if (advancedTime < simpleTime) {
                console.log('🥇 Winner: Advanced Scheduler (same coverage, faster)');
            } else {
                console.log('🥇 Winner: Simple Scheduler (same coverage, faster)');
            }
        } else if (advancedResult.success) {
            console.log('🥇 Winner: Advanced Scheduler (only successful)');
        } else if (simpleResult.success) {
            console.log('🥇 Winner: Simple Scheduler (only successful)');
        } else {
            console.log('💥 Both algorithms failed!');
        }

        console.log('\n✅ Algorithm testing completed!');

    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

testAllAlgorithms()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test script error:', error);
        process.exit(1);
    });