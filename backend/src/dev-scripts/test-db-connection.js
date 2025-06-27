// backend/src/dev-scripts/test-db-connection.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

console.log('🔍 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL (first 50 chars):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
console.log('.env file path:', path.resolve(__dirname, '../../../.env'));

const { Sequelize } = require('sequelize');

async function testConnection() {
    try {
        // Test with DATABASE_URL
        if (process.env.DATABASE_URL) {
            console.log('\n📡 Testing connection with DATABASE_URL...');

            const sequelize = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'mysql',
                dialectOptions: {
                    ssl: {
                        require: false,
                        rejectUnauthorized: false
                    },
                    connectTimeout: 60000
                },
                logging: console.log
            });

            await sequelize.authenticate();
            console.log('✅ DATABASE_URL connection successful!');

            // Show connection details
            const config = sequelize.config;
            console.log('Connected to:', {
                host: config.host,
                database: config.database,
                port: config.port
            });

            await sequelize.close();
        } else {
            console.log('\n❌ DATABASE_URL is not set!');
        }

        // Test with individual params
        console.log('\n📡 Testing connection with individual params...');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_NAME:', process.env.DB_NAME);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_PORT:', process.env.DB_PORT);

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);
    }
}

testConnection();