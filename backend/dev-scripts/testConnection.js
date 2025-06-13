// backend/src/scripts/testConnection.js
const axios = require('axios');

async function testConnection() {
    const baseURL = 'http://localhost:5000';

    console.log('Testing connection to:', baseURL);

    try {
        // Попробуем простой запрос
        const response = await axios.get(baseURL);
        console.log('Server responded with status:', response.status);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Cannot connect to server at', baseURL);
            console.error('Make sure the server is running with: npm start');
        } else {
            console.error('Error:', error.message);
        }
    }

    // Попробуем логин
    try {
        console.log('\nTrying to login...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            login: 'admin',
            password: 'admin123'
        });
        console.log('✓ Login successful!');
        console.log('Response:', loginResponse.data);
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
    }
}

testConnection();