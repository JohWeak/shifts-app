#!/usr/bin/env node

const readline = require('readline');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Available features for testing
const features = {
    'auth': {
        name: '🔐 Authentication',
        path: 'auth/index.test.js',
        description: 'Test login, logout, session management, security.',
        category: 'Core Features',
    },
    'admin-employee-management': {
        name: '👥 Employee Management',
        path: 'admin-employee-management/index.test.js',
        description: 'Test employee CRUD operations, modals, filters, pagination.',
        category: 'Admin Features',
    },
    'admin-schedule-management': {
        name: '📅 Schedule Management',
        path: 'admin-schedule-management/index.test.js',
        description: 'Test schedule generation, employee assignments, drag-drop.',
        category: 'Admin Features',
    },
    'admin-dashboard': {
        name: '📊 Admin Dashboard',
        path: 'admin-dashboard/index.test.js',
        description: 'Test metrics display, overview cards, navigation.',
        category: 'Admin Features',
    },
    'admin-workplace-settings': {
        name: '🏢 Workplace Settings',
        path: 'admin-workplace-settings/index.test.js',
        description: 'Test work sites, positions, shifts configuration.',
        category: 'Admin Features',
    },
    'admin-algorithm-settings': {
        name: '🤖 Algorithm Settings',
        path: 'admin-algorithm-settings/index.test.js',
        description: 'Test algorithm configuration, optimization parameters.',
        category: 'Admin Features',
    },
    'admin-permanent-requests': {
        name: '📋 Permanent Requests Review',
        path: 'admin-permanent-requests/index.test.js',
        description: 'Test permanent constraint requests review and approval.',
        category: 'Admin Features',
    },
    'admin-position-settings': {
        name: '💼 Position Settings',
        path: 'admin-position-settings/index.test.js',
        description: 'Test position configuration and management.',
        category: 'Admin Features',
    },
    'admin-reports': {
        name: '📊 Reports & Analytics',
        path: 'admin-reports/index.test.js',
        description: 'Test report generation, analytics, data export.',
        category: 'Admin Features',
    },
    'admin-system-settings': {
        name: '⚙️ System Settings',
        path: 'admin-system-settings/index.test.js',
        description: 'Test system configuration, global settings.',
        category: 'Admin Features',
    },
    'employee-dashboard': {
        name: '👤 Employee Dashboard',
        path: 'employee-dashboard/index.test.js',
        description: 'Test personal dashboard, stats, quick actions.',
        category: 'Employee Features',
    },
    'employee-schedule': {
        name: '📋 Employee Schedule',
        path: 'employee-schedule/index.test.js',
        description: 'Test schedule viewing, personal calendar, shift details.',
        category: 'Employee Features',
    },
    'employee-requests': {
        name: '✋ Employee Requests',
        path: 'employee-requests/index.test.js',
        description: 'Test time-off requests, shift changes, approvals.',
        category: 'Employee Features',
    },
    'employee-archive': {
        name: '📚 Employee Archive',
        path: 'employee-archive/index.test.js',
        description: 'Test shift history, calendar view, monthly statistics.',
        category: 'Employee Features',
    },
    'employee-constraints': {
        name: '⏰ Employee Constraints',
        path: 'employee-constraints/index.test.js',
        description: 'Test availability constraints, time preferences.',
        category: 'Employee Features',
    },
};

const featureKeys = Object.keys(features);

function displayWelcome() {
    console.log('\n🧪✨ Interactive Test Runner v3.0');
    console.log('═══════════════════════════════════════');
    console.log('🎯 Welcome to the testing suite for React components');
    console.log('📊 Detailed logging and comprehensive coverage\n');
}

function displayMainMenu() {
    console.log('🔧 Testing Options:');
    console.log('═════════════════════\n');

    console.log('   0) 🚀 Test ALL features');
    console.log('      Runs all available feature tests.\n');

    featureKeys.forEach((key, index) => {
        const feature = features[key];
        console.log(`   ${index + 1}) ${feature.name}`);
        console.log(`      ${feature.description}\n`);
    });

    console.log('💡 Navigation:');
    console.log('   exit) 🚪 Exit');
    console.log('\n' + '═'.repeat(50));
}

function runTests(testPath, featureName, isAll = false, callback) {
    console.log(`\n🚀 Running tests for: ${featureName}`);
    console.log('═'.repeat(50));
    console.log(`📂 Test path: ${testPath}`);
    console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}\n`);

    const isWindows = process.platform === 'win32';
    const npmCommand = isWindows ? 'npm.cmd' : 'npm';
    let output = '';

    const testArgs = ['test', '--', testPath, '--watchAll=false', '--verbose', '--colors'];

    const testProcess = spawn(npmCommand, testArgs, {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd(),
        shell: isWindows,
    });

    testProcess.stdout.on('data', (data) => {
        const dataStr = data.toString();
        process.stdout.write(dataStr);
        output += dataStr;
    });

    testProcess.stderr.on('data', (data) => {
        const dataStr = data.toString();
        process.stderr.write(dataStr);
        output += dataStr;
    });

    testProcess.on('close', (code) => {
        console.log('\n' + '═'.repeat(50));
        let result = { name: featureName, passed: false, output: output };
        if (code === 0) {
            console.log(`✅ All tests passed for ${featureName}!`);
            result.passed = true;
        } else {
            console.log(`❌ Some tests failed for ${featureName}.`);
        }
        console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`);

        if (!isAll) {
            askForNextAction();
        } else {
            callback(result);
        }
    });

    testProcess.on('error', (error) => {
        console.error(`\n💥 Error running tests: ${error.message}`);
        if (!isAll) {
            askForNextAction();
        } else {
            callback({ name: featureName, passed: false, output: `Error: ${error.message}` });
        }
    });
}

async function runAllTests() {
    console.log('\n🚀 Running ALL Feature Tests');
    console.log('═══════════════════════════════');

    const testResults = [];
    const featureEntries = Object.entries(features);

    for (const [key, feature] of featureEntries) {
        await new Promise((resolve) => {
            runTests(feature.path, feature.name, true, (result) => {
                testResults.push(result);
                resolve();
            });
        });
    }

    displaySummary(testResults);
    askForNextAction();
}

function displaySummary(results) {
    console.log('\n\n\n');
    console.log('╔═════════════════════════════════════════════════════╗');
    console.log('║                   TESTING SUMMARY                   ║');
    console.log('╚═════════════════════════════════════════════════════╝');
    console.log('\n');

    let passedCount = 0;
    results.forEach(result => {
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        const color = result.passed ? '\x1b[32m' : '\x1b[31m'; // Green for pass, red for fail
        const resetColor = '\x1b[0m';

        console.log(`${color}■ ${result.name}: ${status}${resetColor}`);

        const passMatch = result.output.match(/PASS/g);
        const failMatch = result.output.match(/FAIL/g);

        if (passMatch || failMatch) {
            const passNum = passMatch ? passMatch.length : 0;
            const failNum = failMatch ? failMatch.length : 0;
            console.log(`   └─ Tests: ${passNum} passed, ${failNum} failed\n`);
        } else {
            console.log(`   └─ Could not retrieve test details.\n`);
        }

        if (result.passed) passedCount++;
    });

    console.log('══════════════════════ OVERALL ════════════════════════\n');
    console.log(`   Total suites: ${results.length}`);
    console.log(`   \x1b[32mPassed: ${passedCount}\x1b[0m`);
    console.log(`   \x1b[31mFailed: ${results.length - passedCount}\x1b[0m\n`);
    console.log('═════════════════════════════════════════════════════\n');
}


function askForNextAction() {
    console.log('\n🔄 What would you like to do next?');
    console.log('   • Press Enter to return to the main menu');
    console.log('   • Type "exit" to quit');
    console.log('   • Type a feature number to run more tests');

    rl.question('\n👉 Your choice: ', (answer) => {
        const trimmedAnswer = answer.trim().toLowerCase();

        if (trimmedAnswer === 'exit' || trimmedAnswer === 'quit') {
            console.log('\n👋 Thanks for using the Interactive Test Runner!');
            rl.close();
        } else if (trimmedAnswer === '') {
            main();
        } else {
            handleUserInput(trimmedAnswer);
        }
    });
}

function handleUserInput(choice) {
    if (choice === 'exit') {
        console.log('\n👋 Thanks for using the Interactive Test Runner!');
        rl.close();
        return;
    }

    const choiceNum = parseInt(choice, 10);

    if (isNaN(choiceNum) || choiceNum < 0 || choiceNum > featureKeys.length) {
        console.log('\n❌ Invalid choice. Please try again.');
        getUserInput();
        return;
    }

    if (choiceNum === 0) {
        runAllTests();
        return;
    }

    const selectedFeatureKey = featureKeys[choiceNum - 1];
    const selectedFeature = features[selectedFeatureKey];

    if (selectedFeature) {
        const testFilePath = path.join(__dirname, 'src', 'features', selectedFeature.path);

        if (!fs.existsSync(testFilePath)) {
            console.log(`\n⚠️  Test file not found: ${testFilePath}`);
            askForNextAction();
            return;
        }
        runTests(selectedFeature.path, selectedFeature.name, false);
    } else {
        console.log('\n❌ Invalid choice. Please try again.');
        getUserInput();
    }
}

function getUserInput() {
    rl.question('\n👉 Enter your choice: ', handleUserInput);
}

function main() {
    console.clear();
    displayWelcome();
    displayMainMenu();
    getUserInput();
}

rl.on('SIGINT', () => {
    console.log('\n\n👋 Test runner interrupted. Goodbye!');
    process.exit(0);
});

main();