// backend/test-diagnosis.js
require('dotenv').config();
const db = require('./src/models');
const cpSatBridge = require('./src/services/cp-sat-bridge.service');
const fs = require('fs').promises;
const path = require('path');

async function diagnoseScheduling(siteId = 1, weekStart = '2025-08-17') {
    console.log('=== SCHEDULE DIAGNOSIS ===');
    console.log(`Site: ${siteId}, Week: ${weekStart}\n`);

    try {
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connected successfully\n');

        // 1. Prepare data
        const data = await cpSatBridge.prepareScheduleData(siteId, weekStart);

        // 2. Analyze constraints
        console.log('=== CONSTRAINTS ANALYSIS ===');
        const constraints = data.constraints;

        console.log(`Total permanent constraints: ${constraints.permanent_cannot_work.length}`);
        console.log(`Total temporary constraints: ${constraints.cannot_work.length}`);
        console.log(`Total prefer work: ${constraints.prefer_work.length}`);

        // Group constraints by employee
        const byEmployee = {};
        constraints.permanent_cannot_work.forEach(c => {
            if (!byEmployee[c.emp_id]) {
                byEmployee[c.emp_id] = { permanent: [], temporary: [] };
            }
            byEmployee[c.emp_id].permanent.push({
                day: data.days[c.day_index]?.day_name,
                day_index: c.day_index,
                shift_id: c.shift_id,
                constraint: 'cannot_work'
            });
        });

        constraints.cannot_work.forEach(c => {
            if (!byEmployee[c.emp_id]) {
                byEmployee[c.emp_id] = { permanent: [], temporary: [] };
            }
            byEmployee[c.emp_id].temporary.push({
                day: data.days[c.day_index]?.day_name,
                day_index: c.day_index,
                shift_id: c.shift_id,
                constraint: 'cannot_work'
            });
        });

        console.log('\nConstraints by Employee:');
        Object.entries(byEmployee).forEach(([empId, constraints]) => {
            const emp = data.employees.find(e => e.emp_id === empId);
            console.log(`\nEmployee ${empId} (${emp?.name}):`);
            if (constraints.permanent.length > 0) {
                console.log('  Permanent:');
                constraints.permanent.forEach(c => {
                    const shift = data.shifts.find(s => s.shift_id === c.shift_id);
                    console.log(`    - ${c.day}: ${c.shift_id ? `Shift ${shift?.shift_name || c.shift_id}` : 'ALL SHIFTS'}`);
                });
            }
            if (constraints.temporary.length > 0) {
                console.log('  Temporary:');
                constraints.temporary.forEach(c => {
                    const shift = data.shifts.find(s => s.shift_id === c.shift_id);
                    console.log(`    - ${c.day}: ${c.shift_id ? `Shift ${shift?.shift_name || c.shift_id}` : 'ALL SHIFTS'}`);
                });
            }
        });

        // 3. Check requirements vs available workforce
        console.log('\n=== REQUIREMENTS ANALYSIS ===');
        const totalRequired = Object.values(data.shift_requirements)
            .reduce((sum, req) => sum + req.required_staff, 0);

        const availableSlots = data.employees.length * 7; // max slots if everyone works every day
        const constrainedSlots = constraints.permanent_cannot_work.length + constraints.cannot_work.length;

        console.log(`Total positions required: ${totalRequired}`);
        console.log(`Total employees: ${data.employees.length}`);
        console.log(`Maximum available slots: ${availableSlots}`);
        console.log(`Blocked by constraints: ${constrainedSlots}`);
        console.log(`Theoretical capacity: ${availableSlots - constrainedSlots}`);

        // Check for over-requirement
        if (totalRequired < data.employees.length * 4) {
            console.log('\n⚠️  WARNING: More employees than needed!');
            console.log(`   Required: ${totalRequired} assignments`);
            console.log(`   Available employees: ${data.employees.length}`);
            console.log(`   Average assignments per employee: ${(totalRequired / data.employees.length).toFixed(2)}`);
        }

        // 4. Analyze shift requirements by position
        console.log('\n=== POSITION-SHIFT REQUIREMENTS ===');
        const byPosition = {};

        data.positions.forEach(pos => {
            byPosition[pos.pos_id] = {
                name: pos.pos_name,
                employees: data.employees.filter(e => e.default_position_id === pos.pos_id).length,
                requirements: {}
            };
        });



        Object.entries(data.shift_requirements).forEach(([key, req]) => {
            if (!byPosition[req.position_id].requirements[req.shift_id]) {
                const shift = data.shifts.find(s => s.shift_id === req.shift_id);
                byPosition[req.position_id].requirements[req.shift_id] = {
                    shift_name: shift?.shift_name,
                    total: 0,
                    days: []
                };
            }
            byPosition[req.position_id].requirements[req.shift_id].total += req.required_staff;
            byPosition[req.position_id].requirements[req.shift_id].days.push({
                date: req.date,
                required: req.required_staff
            });
        });

        Object.entries(byPosition).forEach(([posId, info]) => {
            console.log(`\n${info.name}:`);
            console.log(`  Employees with this position: ${info.employees}`);
            Object.entries(info.requirements).forEach(([shiftId, req]) => {
                console.log(`  ${req.shift_name}: ${req.total} total assignments`);
                const multiDays = req.days.filter(d => d.required > 1);
                if (multiDays.length > 0) {
                    console.log(`    Days requiring multiple staff:`);
                    multiDays.forEach(d => {
                        console.log(`      ${d.date}: ${d.required} staff`);
                    });
                }
            });
        });

        // 5. Save diagnosis data
        const diagnosisDir = path.join(__dirname, 'diagnosis');
        await fs.mkdir(diagnosisDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `diagnosis_site${siteId}_${timestamp}.json`;
        const filepath = path.join(diagnosisDir, filename);

        await fs.writeFile(filepath, JSON.stringify({
            metadata: {
                site_id: siteId,
                week_start: weekStart,
                generated_at: new Date().toISOString()
            },
            summary: {
                employees_count: data.employees.length,
                positions_count: data.positions.length,
                shifts_count: data.shifts.length,
                total_requirements: totalRequired,
                permanent_constraints: constraints.permanent_cannot_work.length,
                temporary_constraints: constraints.cannot_work.length,
                employees_by_position: Object.fromEntries(
                    data.positions.map(pos => [
                        pos.pos_name,
                        data.employees.filter(e => e.default_position_id === pos.pos_id).length
                    ])
                )
            },
            warnings: totalRequired < data.employees.length * 4 ?
                ['More employees available than needed - expect over-assignment'] : [],
            constraints_by_employee: byEmployee,
            requirements_by_position: byPosition,
            full_data: data
        }, null, 2));

        console.log(`\n✅ Diagnosis saved to: ${filename}`);

        // 6. Test Python optimizer
        console.log('\n=== TESTING PYTHON OPTIMIZER ===');
        const result = await cpSatBridge.callPythonOptimizer(data);

        if (result.success) {
            console.log('✅ Optimization successful!');
            console.log(`   Assignments: ${result.schedule.length}`);
            console.log(`   Coverage: ${result.coverage_rate.toFixed(1)}%`);
            console.log(`   Shortage: ${result.shortage_count}`);

            // Check for over-assignment
            const assignmentsByShiftDay = {};
            result.schedule.forEach(a => {
                const key = `${a.position_id}-${a.shift_id}-${a.date}`;
                if (!assignmentsByShiftDay[key]) {
                    assignmentsByShiftDay[key] = [];
                }
                assignmentsByShiftDay[key].push(a.emp_id);
            });

            console.log('\n=== ASSIGNMENT ANALYSIS ===');
            let overAssignments = 0;
            Object.entries(assignmentsByShiftDay).forEach(([key, empIds]) => {
                const [posId, shiftId, date] = key.split('-');
                const reqKey = `${posId}-${shiftId}-${date}`;
                const requirement = data.shift_requirements[reqKey];

                if (requirement && empIds.length > requirement.required_staff) {
                    overAssignments++;
                    const pos = data.positions.find(p => p.pos_id === posId);
                    const shift = data.shifts.find(s => s.shift_id === shiftId);
                    console.log(`❌ OVER-ASSIGNMENT: ${pos?.pos_name} - ${shift?.shift_name} on ${date}`);
                    console.log(`   Required: ${requirement.required_staff}, Assigned: ${empIds.length}`);
                }
            });

            if (overAssignments === 0) {
                console.log('✅ No over-assignments detected');
            } else {
                console.log(`\n❌ Found ${overAssignments} over-assignments!`);
            }

            // Save result
            const resultFilename = `result_site${siteId}_${timestamp}.json`;
            await fs.writeFile(
                path.join(diagnosisDir, resultFilename),
                JSON.stringify(result, null, 2)
            );
            console.log(`\n✅ Result saved to: ${resultFilename}`);

        } else {
            console.log('❌ Optimization failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Diagnosis error:', error);
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
}

// Run diagnosis
const siteId = process.argv[2] || 1;
const weekStart = process.argv[3] || '2025-08-17';

console.log('Starting diagnosis with database config:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');

diagnoseScheduling(parseInt(siteId), weekStart)
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });