// backend/src/dev-scripts/test-schedule-generation.js
const db = require('../src/models');
const CPSATBridge = require('../src/services/cp-sat-bridge.service');
const ScheduleGeneratorService = require('../src/services/schedule-generator.service');
const dayjs = require('dayjs');

async function testScheduleGeneration() {
    try {
        console.log('🧪 Testing Schedule Generation with New Structure\n');

        const siteId = 1;
        const weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');

        console.log(`📅 Testing for site ${siteId}, week starting ${weekStart}\n`);

        // Test 1: Simple Algorithm
        console.log('1️⃣ Testing Simple Algorithm...');
        try {
            const simpleResult = await ScheduleGeneratorService.generateWeeklySchedule(db, siteId, weekStart);
            console.log('Result:', simpleResult.success ? '✅ Success' : '❌ Failed');
            if (simpleResult.success) {
                console.log(`Assignments: ${simpleResult.schedule.assignments_count}`);
            } else {
                console.log('Error:', simpleResult.error);
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        console.log('\n' + '-'.repeat(50) + '\n');

        // Test 2: CP-SAT Algorithm
        console.log('2️⃣ Testing CP-SAT Algorithm...');
        try {
            const cpsatResult = await CPSATBridge.generateOptimalSchedule(db, siteId, weekStart);
            console.log('Result:', cpsatResult.success ? '✅ Success' : '❌ Failed');
            if (cpsatResult.success) {
                console.log(`Assignments: ${cpsatResult.schedule.assignments_count}`);
                console.log(`Coverage: ${cpsatResult.coverage_rate}%`);
            } else {
                console.log('Error:', cpsatResult.error);
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run test
testScheduleGeneration();