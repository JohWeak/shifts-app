// backend/src/scripts/testRecommendations.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');
const dayjs = require('dayjs');

async function testRecommendationsAPI() {
    try {
        console.log('=== Testing Employee Recommendations API ===\n');

        // First, login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            login: 'admin',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✓ Logged in successfully\n');

        // Test date (next Monday)
        const testDate = dayjs().add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD');

        // Test parameters
        const testCases = [
            {
                name: 'Morning shift for Security Guard',
                params: {
                    position_id: 1,  // Security Guard
                    shift_id: 31,    // Morning shift
                    date: testDate
                }
            },
            {
                name: 'Night shift for Receptionist',
                params: {
                    position_id: 2,  // Receptionist
                    shift_id: 33,    // Night shift
                    date: testDate
                }
            }
        ];

        for (const testCase of testCases) {
            console.log(`\nTesting: ${testCase.name}`);
            console.log(`Parameters:`, testCase.params);

            const response = await axios.get('http://localhost:3001/api/employees/recommendations', {
                params: testCase.params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const data = response.data.data;
                console.log('\nResults:');
                console.log(`- Available: ${data.available.length} employees`);
                console.log(`- Cross-position: ${data.cross_position.length} employees`);
                console.log(`- Unavailable (busy): ${data.unavailable_busy.length} employees`);
                console.log(`- Unavailable (constraints): ${data.unavailable_hard.length} employees`);
                console.log(`- Unavailable (preferences): ${data.unavailable_soft.length} employees`);

                // Show first available employee details
                if (data.available.length > 0) {
                    const firstAvailable = data.available[0];
                    console.log('\nTop recommendation:');
                    console.log(`- Name: ${firstAvailable.first_name} ${firstAvailable.last_name}`);
                    console.log(`- Position: ${firstAvailable.default_position_name}`);
                    console.log(`- Score: ${firstAvailable.recommendation.score}`);
                    console.log(`- Reasons:`, firstAvailable.recommendation.reasons);
                }
            } else {
                console.error('API Error:', response.data.error);
            }
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testRecommendationsAPI();