// backend/src/scripts/testRecommendationsDebug.js
const axios = require('axios');
const dayjs = require('dayjs');

async function testRecommendationsAPI() {
    try {
        console.log('=== Testing Employee Recommendations API ===\n');

        const baseURL = 'http://localhost:5000';

        // Login
        console.log('Logging in...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            login: 'admin',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✓ Login successful\n');

        // Set default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['x-access-token'] = token;

        // Test date
        const testDate = dayjs().add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD');
        console.log(`Test date: ${testDate}\n`);

        // First, let's check what routes are available
        console.log('Testing different API endpoints:\n');

        const endpoints = [
            '/api/employees',
            '/api/employees/recommendations',
            '/api/schedule/recommendations/employees',
            '/api/recommendations/employees'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Testing ${endpoint}...`);
                const response = await axios.get(`${baseURL}${endpoint}`, {
                    params: {
                        position_id: 1,
                        shift_id: 31,
                        date: testDate
                    }
                });
                console.log(`✓ ${endpoint} - Status: ${response.status}`);

                // If this is the recommendations endpoint, show results
                if (response.data.data && response.data.success) {
                    const data = response.data.data;
                    console.log('  Found recommendations:');
                    console.log(`  - Available: ${data.available?.length || 0}`);
                    console.log(`  - Cross-position: ${data.cross_position?.length || 0}`);
                    console.log(`  - Unavailable: ${
                        (data.unavailable_busy?.length || 0) +
                        (data.unavailable_hard?.length || 0) +
                        (data.unavailable_soft?.length || 0)
                    }`);
                }
                console.log('');
            } catch (error) {
                console.log(`✗ ${endpoint} - Error: ${error.response?.status || error.code}`);
                if (error.response?.status === 404) {
                    console.log('  Route not found');
                } else if (error.response?.data) {
                    console.log(`  Message: ${error.response.data.message || error.response.data.error}`);
                }
                console.log('');
            }
        }

        // Now let's test with the correct endpoint (if we found it)
        console.log('\nTesting recommendations with full parameters:\n');

        try {
            // Based on your routes file, it should be /api/employees/recommendations
            const response = await axios.get(`${baseURL}/api/employees/recommendations`, {
                params: {
                    position_id: 1,
                    shift_id: 31,
                    date: testDate
                }
            });

            if (response.data.success) {
                const data = response.data.data;
                console.log('Success! Recommendations received:\n');

                // Show summary
                console.log('Summary:');
                console.log(`- Total available: ${data.available.length}`);
                console.log(`- Total cross-position: ${data.cross_position.length}`);
                console.log(`- Total unavailable: ${
                    data.unavailable_busy.length +
                    data.unavailable_hard.length +
                    data.unavailable_soft.length
                }`);

                // Show details of first available
                if (data.available.length > 0) {
                    console.log('\nFirst available employee:');
                    const emp = data.available[0];
                    console.log(`- Name: ${emp.first_name} ${emp.last_name}`);
                    console.log(`- ID: ${emp.emp_id}`);
                    console.log(`- Position: ${emp.default_position_name || 'No position'}`);
                    console.log(`- Score: ${emp.recommendation.score}`);
                    console.log(`- Reasons:`, emp.recommendation.reasons);
                }

                // Show constraint violations if any
                if (data.unavailable_hard.length > 0) {
                    console.log('\nEmployees with hard constraints:');
                    data.unavailable_hard.forEach(emp => {
                        console.log(`- ${emp.first_name} ${emp.last_name}: ${emp.unavailable_reason}`);
                    });
                }
            }
        } catch (error) {
            console.error('Final test failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testRecommendationsAPI();