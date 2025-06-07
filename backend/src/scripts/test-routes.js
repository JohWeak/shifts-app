// backend/src/scripts/test-routes.js
const express = require('express');

function testRoutes() {
    console.log('🧪 Testing route imports...');

    try {
        const authRoutes = require('../routes/auth.routes');
        console.log('✅ auth.routes imported successfully');

        const employeeRoutes = require('../routes/employee.routes');
        console.log('✅ employee.routes imported successfully');

        const constraintRoutes = require('../routes/constraint.routes');
        console.log('✅ constraint.routes imported successfully');

        const scheduleRoutes = require('../routes/schedule.routes');
        console.log('✅ schedule.routes imported successfully');

        console.log('🎉 All routes imported successfully!');

    } catch (error) {
        console.error('❌ Route import failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testRoutes();