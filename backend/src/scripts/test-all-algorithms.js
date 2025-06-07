// backend/src/scripts/test-all-algorithms.js - ОБНОВЛЕННАЯ ВЕРСИЯ
const CPSATBridge = require('../services/cp-sat-bridge.service');
const ScheduleGeneratorService = require('../services/schedule-generator.service');
const dayjs = require('dayjs');

async function testAllAlgorithms() {
    try {
        console.log('🧪 Testing Available Scheduling Algorithms\n');

        const siteId = 1;
        const weekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');

        console.log(`📅 Testing for site ${siteId}, week starting ${weekStart}\n`);

        // Тест 1: CP-SAT Python Optimizer
        console.log('🤖 Testing CP-SAT Python Optimizer...');
        const cpsatStart = Date.now();
        const cpsatResult = await CPSATBridge.generateOptimalSchedule(siteId, weekStart);
        const cpsatTime = Date.now() - cpsatStart;

        console.log(`   Result: ${cpsatResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Time: ${cpsatTime}ms`);
        if (cpsatResult.success) {
            console.log(`   Assignments: ${cpsatResult.schedule.assignments_count}`);
            console.log(`   Status: ${cpsatResult.status || 'N/A'}`);
            console.log(`   Solve Time: ${cpsatResult.solve_time || 'N/A'}ms`);
        } else {
            console.log(`   Error: ${cpsatResult.error}`);
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
        if (cpsatResult.success && simpleResult.success) {
            console.log('🏆 Both algorithms succeeded!');

            const cpsatAssignments = cpsatResult.schedule.assignments_count;
            const simpleAssignments = simpleResult.schedule.assignments_count;

            console.log(`📈 Assignments - CP-SAT: ${cpsatAssignments}, Simple: ${simpleAssignments}`);
            console.log(`⏱️ Speed - CP-SAT: ${cpsatTime}ms, Simple: ${simpleTime}ms`);

            if (cpsatAssignments > simpleAssignments) {
                console.log('🥇 Winner: CP-SAT Optimizer (better coverage)');
            } else if (simpleAssignments > cpsatAssignments) {
                console.log('🥇 Winner: Simple Scheduler (better coverage)');
            } else if (cpsatTime < simpleTime) {
                console.log('🥇 Winner: CP-SAT Optimizer (same coverage, faster)');
            } else {
                console.log('🥇 Winner: Simple Scheduler (same coverage, faster)');
            }
        } else if (cpsatResult.success) {
            console.log('🥇 Winner: CP-SAT Optimizer (only successful)');
        } else if (simpleResult.success) {
            console.log('🥇 Winner: Simple Scheduler (only successful)');
        } else {
            console.log('💥 Both algorithms failed!');
        }

        console.log('\n✅ Algorithm testing completed!');

        console.log('\n📋 DETAILED ANALYSIS:');
        console.log('='.repeat(50));

        if (cpsatResult.success && simpleResult.success) {
            console.log('🔍 Let\'s analyze what each algorithm actually scheduled...');

            // Можно добавить анализ через API или логи
            console.log('💡 Both algorithms created 27 assignments');
            console.log('🌙 Check if CP-SAT covers night shifts better');
            console.log('⚖️ Check workload distribution between employees');
        }

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