// backend/src/scripts/testRecommendations.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');
const dayjs = require('dayjs');

async function testRecommendationsAPI() {
    try {
        console.log('=== Testing Employee Recommendations API ===\n');

        const baseURL = 'http://localhost:5000'; // Исправлен порт
        console.log(`Using API URL: ${baseURL}`);

        // First, login as admin
        console.log('\nAttempting to login...');
        try {
            const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
                login: 'admin',
                password: 'admin123'
            });

            const token = loginResponse.data.token;
            console.log('✓ Logged in successfully');
            console.log('Token received:', token ? 'Yes' : 'No');
            console.log('User role:', loginResponse.data.role);

            // Test date (next Monday)
            const testDate = dayjs().add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD');
            console.log(`\nTest date: ${testDate}`);

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
                console.log(`\n${'='.repeat(50)}`);
                console.log(`Testing: ${testCase.name}`);
                console.log(`Parameters:`, testCase.params);

                try {
                    const response = await axios.get(`${baseURL}/api/employees/recommendations`, {
                        params: testCase.params,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'x-access-token': token // Альтернативный заголовок
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
                            console.log(`- Position: ${firstAvailable.default_position_name || 'No position'}`);
                            console.log(`- Score: ${firstAvailable.recommendation.score}`);
                            console.log(`- Reasons:`, firstAvailable.recommendation.reasons);
                        } else {
                            console.log('\nNo available employees for this shift');
                        }
                    } else {
                        console.error('API Error:', response.data.error);
                    }
                } catch (apiError) {
                    console.error(`\nAPI call failed for ${testCase.name}:`);
                    console.error('Error:', apiError.response?.data || apiError.message);
                    if (apiError.response) {
                        console.error('Status:', apiError.response.status);
                        console.error('Headers:', apiError.response.headers);
                    }
                }
            }

            console.log(`\n${'='.repeat(50)}`);
            console.log('=== Test Complete ===');

        } catch (loginError) {
            console.error('\nLogin failed:');
            console.error('Error:', loginError.response?.data || loginError.message);
            if (loginError.response) {
                console.error('Status:', loginError.response.status);
                console.error('URL:', loginError.config?.url);
            }

            // Проверим, работает ли сервер вообще
            try {
                const healthCheck = await axios.get(`${baseURL}/api/health`);
                console.log('\nServer is running but login failed');
            } catch (e) {
                console.error('\nServer appears to be down or not accessible at', baseURL);
                console.error('Make sure the backend server is running with: npm start');
            }
        }

    } catch (error) {
        console.error('\nUnexpected error:');
        console.error(error);
    }
}

// Run the test
testRecommendationsAPI();