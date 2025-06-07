// backend/src/scripts/test-new-constraints.js
const { Employee, EmployeeConstraint, Shift } = require('../models/associations');
const dayjs = require('dayjs');

async function testNewConstraintSystem() {
    try {
        console.log('🧪 Testing new constraint system...');

        // 1. Get test employee
        const employee = await Employee.findOne({ where: { status: 'active' } });
        if (!employee) {
            console.log('❌ No active employees found');
            return;
        }

        console.log(`👤 Testing with employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.emp_id})`);

        // 2. Get shifts
        const shifts = await Shift.findAll();
        console.log(`🕐 Found ${shifts.length} shifts:`, shifts.map(s => s.shift_name));

        // 3. Create test constraint
        const nextWeek = dayjs().add(7, 'day').startOf('week');
        const testDate = nextWeek.format('YYYY-MM-DD');

        const testConstraint = await EmployeeConstraint.create({
            emp_id: employee.emp_id,
            constraint_type: 'cannot_work',
            applies_to: 'specific_date',
            target_date: testDate,
            shift_id: shifts[0].shift_id,
            is_permanent: false,
            status: 'active'
        });

        console.log(`✅ Created test constraint:`, {
            id: testConstraint.id,
            type: testConstraint.constraint_type,
            date: testConstraint.target_date,
            shift: shifts[0].shift_name
        });

        // 4. Test retrieval
        const constraints = await EmployeeConstraint.findAll({
            where: { emp_id: employee.emp_id },
            include: [
                { model: Employee, as: 'employee' },
                { model: Shift, as: 'shift' }
            ]
        });

        console.log(`📋 Retrieved ${constraints.length} constraints for employee`);

        // 5. Clean up test data
        await testConstraint.destroy();
        console.log('🧹 Cleaned up test constraint');

        console.log('✅ New constraint system test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run test
testNewConstraintSystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Test script error:', error);
        process.exit(1);
    });