// testApiEndpoints.js
const axios = require('axios');

// Dynamically import chalk to support ESM in a CommonJS script
let chalk;
import('chalk').then(module => {
    chalk = module.default;
});

// ====================================================================
// ========================== SETTINGS ===============================
// ====================================================================

const API_BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU2MTgwNjgzLCJleHAiOjE3NTYyNjcwODN9.4LHYvwck4zgJlheXU8zBL6AfSk7jtmNt_GTlq0WI8hs';

const config = {
    testWorksiteId: 1,
    testPositionId: 1,
    testShiftId: 1,
    testRequirementId: 1,
    testScheduleId: 397,
    testEmployeeId: 1,
    testRequestId: 1,
    testFormat: 'xlsx',
    testYear: new Date().getFullYear(),
    testMonth: new Date().getMonth() + 1
};

// ====================================================================
// ===================== END OF CONFIGURATION =========================
// ====================================================================


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
    }
});

// --- Logging Functions ---
const logSuccess = (method, path, message = 'OK') => console.log(`[ ${chalk.green('✓')} ${method.padEnd(6)} ] ${path} -> ${chalk.green(message)}`);
const logError = (method, path, error) => {
    const status = error.response?.status || 'N/A';
    const data = error.response?.data;
    const responseBody = (typeof data === 'object') ? JSON.stringify(data) : String(data).substring(0, 250) + '...';
    console.error(`[ ${chalk.red('✗')} ${method.padEnd(6)} ] ${path} -> ${chalk.red(status)} | ${chalk.yellow(responseBody)}`);
};
const logInfo = (message) => console.log(chalk.blue(`\n--- ${message} ---\n`));

// --- Sample Data for POST/PUT Requests ---
// REVISED AGAIN: Wrapping data in a root key (e.g., "site") as the UI likely does this.
// This should fix the "name is required" errors.
const sampleWorksiteData = {site: {name: 'Test Site From Script', location: 'Test Location'}};
const samplePositionData = {position: {name: 'Test Position From Script', work_site_id: config.testWorksiteId}};
const sampleShiftData = {shift: {name: 'Test Shift From Script', start_time: '09:00', end_time: '17:00'}};
const sampleEmployeeData = {
    first_name: 'Test',
    last_name: 'User',
    email: `test${Date.now()}@example.com`,
    login: `testuser${Date.now()}`,
    password: 'password123',
    work_site_id: config.testWorksiteId,
    default_position_id: config.testPositionId
};
const sampleScheduleSettings = {
    work_site_id: config.testWorksiteId,
    start_date: '2025-09-01',
    end_date: '2025-09-07',
    settings: {default_employees_per_shift: 1}
};
const sampleSystemSettings = {settings: {weekStartDay: 1, dateFormat: 'YYYY-MM-DD'}};
const sampleWeeklyConstraints = {
    constraints: {
        "2025-09-01": {
            day_status: "neutral",
            shifts: {[config.testShiftId]: "cannot_work"}
        }
    }
};
const samplePermanentRequest = {constraints: [{type: 'cannot_work', day: 'monday', shift_id: config.testShiftId}]};
const sampleRequirementData = {requirement: {min_employees: 2, max_employees: 5, type: 'daily'}};


/**
 * Main function to run all API tests.
 */
async function runApiTests() {
    logInfo('--- Starting API Endpoint Test Suite... ---');
    if (AUTH_TOKEN.startsWith('eyJhbGciOi...')) console.log(chalk.yellow('WARNING: You are using a placeholder token.'));

    // --- Auth ---
    logInfo('\n--- Testing: Auth ---');
    await testEndpoint('GET', '/api/auth/profile');

    // --- Worksites & Positions ---
    logInfo('\n--- Testing: Worksites & Positions ---');
    await testEndpoint('GET', '/api/worksites');
    await testEndpoint('POST', '/api/worksites', sampleWorksiteData);
    await testEndpoint('GET', `/api/worksites/${config.testWorksiteId}`);
    await testEndpoint('PUT', `/api/worksites/${config.testWorksiteId}`, {site: {name: 'Updated Test Site'}});
    await testEndpoint('POST', `/api/worksites/${config.testWorksiteId}/restore`);
    await testEndpoint('GET', `/api/worksites/${config.testWorksiteId}/statistics?startDate=2025-01-01&endDate=2025-12-31`);
    await testEndpoint('GET', `/api/worksites/${config.testWorksiteId}/positions`);

    // --- Positions ---
    await testEndpoint('GET', '/api/positions');
    await testEndpoint('POST', '/api/positions', samplePositionData);
    await testEndpoint('GET', `/api/positions/${config.testPositionId}`);
    await testEndpoint('PUT', `/api/positions/${config.testPositionId}`, {position: {name: 'Updated Position'}});
    await testEndpoint('POST', `/api/positions/${config.testPositionId}/restore`);
    await testEndpoint('GET', `/api/positions/${config.testPositionId}/requirements-matrix`);

    // --- Shifts & Requirements ---
    logInfo('\n--- Testing: Shifts & Requirements ---');
    await testEndpoint('GET', `/api/positions/${config.testPositionId}/shifts`);
    await testEndpoint('POST', `/api/positions/${config.testPositionId}/shifts`, sampleShiftData);
    await testEndpoint('GET', `/api/shifts/${config.testShiftId}`);
    await testEndpoint('PUT', `/api/shifts/${config.testShiftId}`, {shift: {name: 'Updated Shift'}});
    await testEndpoint('POST', `/api/shifts/${config.testShiftId}/requirements`, sampleRequirementData);
    await testEndpoint('PUT', `/api/requirements/${config.testRequirementId}`, {requirement: {min_employees: 3}});

    // --- Schedules ---
    logInfo('\n--- Testing: Schedules ---');
    await testEndpoint('GET', '/api/schedules');
    await testEndpoint('POST', '/api/schedules/generate', sampleScheduleSettings);
    await testEndpoint('POST', '/api/schedules/compare-algorithms', sampleScheduleSettings);
    await testEndpoint('GET', `/api/schedules/${config.testScheduleId}`);
    await testEndpoint('PUT', `/api/schedules/${config.testScheduleId}/status`, {status: 'published'});
    await testEndpoint('PUT', `/api/schedules/${config.testScheduleId}/update-assignments`, {changes: []});
    await testEndpoint('GET', `/api/schedules/${config.testScheduleId}/export?format=${config.testFormat}`);
    await testEndpoint('POST', `/api/schedules/${config.testScheduleId}/validate`, {changes: []});
    await testEndpoint('GET', '/api/schedules/weekly');
    await testEndpoint('GET', `/api/schedules/position/${config.testPositionId}/weekly`);
    await testEndpoint('GET', '/api/schedules/employee/archive/summary');
    await testEndpoint('GET', `/api/schedules/employee/archive/month?year=${config.testYear}&month=${config.testMonth}`);

    // --- Employees ---
    logInfo('\n--- Testing: Employees ---');
    await testEndpoint('GET', '/api/employees');
    await testEndpoint('POST', '/api/employees', sampleEmployeeData);
    await testEndpoint('GET', `/api/employees/${config.testEmployeeId}`);
    await testEndpoint('PUT', `/api/employees/${config.testEmployeeId}`, {first_name: 'Updated Name'});
    await testEndpoint('GET', `/api/employees/recommendations?position_id=${config.testPositionId}&shift_id=${config.testShiftId}&date=2025-09-01&schedule_id=${config.testScheduleId}`);
    await testEndpoint('GET', '/api/employees/my-shifts');

    // --- Constraints ---
    logInfo('\n--- Testing: Constraints ---');
    await testEndpoint('GET', '/api/constraints/weekly-grid');
    await testEndpoint('POST', '/api/constraints/submit-weekly', sampleWeeklyConstraints);
    await testEndpoint('GET', '/api/constraints/permanent-requests/my');
    await testEndpoint('POST', '/api/constraints/permanent-request', samplePermanentRequest);
    await testEndpoint('GET', '/api/constraints/permanent-constraints/my');
    await testEndpoint('GET', '/api/constraints/permanent-requests');
    await testEndpoint('GET', '/api/constraints/permanent-requests/count');
    await testEndpoint('PUT', `/api/constraints/permanent-request/${config.testRequestId}/review`, {status: 'approved'});

    // --- Settings ---
    logInfo('\n--- Testing: Settings ---');
    await testEndpoint('GET', '/api/settings/system');
    await testEndpoint('PUT', '/api/settings/system', sampleSystemSettings);

    // --- DELETE Endpoints ---
    logInfo('\n--- Testing: DELETE (disabled by default) ---');
    // await testEndpoint('DELETE', `/api...`);

    logInfo('\n--- Test Suite Finished! ---');
}

async function testEndpoint(method, path, data = null) {
    // ... function remains the same
    try {
        let response;
        switch (method.toUpperCase()) {
            case 'GET':
                response = await api.get(path, {params: data});
                break;
            case 'POST':
                response = await api.post(path, data);
                break;
            case 'PUT':
                response = await api.put(path, data);
                break;
            case 'DELETE':
                response = await api.delete(path);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
        logSuccess(method, path, `${response.status} ${response.statusText}`);
    } catch (error) {
        logError(method, path, error);
    }
}

async function main() {
    // ... function remains the same
    while (!chalk) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    await runApiTests();
}

main();