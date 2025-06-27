// backend/dev-scripts/test-python-direct.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function testPython() {
    const testData = {
        employees: [{emp_id: 1, name: "Test", default_position_id: 1}],
        shifts: [{shift_id: 1, shift_name: "Morning", duration: 8}],
        positions: [{pos_id: 1, pos_name: "Test Position", num_of_emp: 1}],
        days: [{date: "2025-06-29", day_name: "Sunday", day_index: 0, weekday: 0}],
        constraints: {cannot_work: [], prefer_work: []},
        settings: {}
    };

    const tempFile = path.join(__dirname, '..', 'temp', 'test_data.json');
    await fs.mkdir(path.dirname(tempFile), { recursive: true });
    await fs.writeFile(tempFile, JSON.stringify(testData, null, 2));

    const pythonScript = path.join(__dirname, '..', 'src', 'services', 'cp_sat_optimizer.py');

    console.log('Running Python script...');
    const python = spawn('python', [pythonScript, tempFile]);

    python.stdout.on('data', (data) => {
        console.log('STDOUT:', data.toString());
    });

    python.stderr.on('data', (data) => {
        console.log('STDERR:', data.toString());
    });

    python.on('close', (code) => {
        console.log('Exit code:', code);
    });
}

testPython();