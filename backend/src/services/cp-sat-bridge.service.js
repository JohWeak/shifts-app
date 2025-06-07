// backend/src/services/cp-sat-bridge.service.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const CONSTRAINTS = require('../config/scheduling-constraints');

class CPSATBridge {
    async prepareScheduleData(siteId, weekStart) {
        const {
            Employee,
            Shift,
            EmployeeConstraint,
            ScheduleSettings,
            Position
        } = require('../models/associations');
        const { Op } = require('sequelize');
        const dayjs = require('dayjs');

        const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

        const employees = await Employee.findAll({
            where: { status: 'active' },
            attributes: ['emp_id', 'first_name', 'last_name']
        });

        const shifts = await Shift.findAll({
            attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type'],
            order: [['start_time', 'ASC']]
        });

        const positions = await Position.findAll({
            where: { site_id: siteId },
            attributes: ['pos_id', 'pos_name', 'num_of_emp']
        });

        const settings = await ScheduleSettings.findOne({
            where: { site_id: siteId }
        }) || {
            max_shifts_per_day: CONSTRAINTS.SOFT_CONSTRAINTS.max_shifts_per_day,
            max_hours_per_week: CONSTRAINTS.SOFT_CONSTRAINTS.max_hours_per_week,
            max_consecutive_work_days: CONSTRAINTS.SOFT_CONSTRAINTS.max_consecutive_work_days
        };

        const constraints = await EmployeeConstraint.findAll({
            where: {
                status: 'active',
                [Op.or]: [
                    {
                        is_permanent: true,
                        applies_to: 'day_of_week'
                    },
                    {
                        is_permanent: false,
                        applies_to: 'specific_date',
                        target_date: {
                            [Op.between]: [weekStart, weekEnd]
                        }
                    }
                ]
            }
        });

        const days = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = dayjs(weekStart).add(i, 'day');
            days.push({
                index: i,
                date: currentDate.format('YYYY-MM-DD'),
                dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.day()]
            });
        }

        const processedConstraints = {
            cannot_work: [],
            prefer_work: []
        };

        constraints.forEach(constraint => {
            const constraintData = {
                emp_id: constraint.emp_id,
                shift_id: constraint.shift_id
            };

            if (constraint.applies_to === 'specific_date') {
                const dayIndex = days.findIndex(day => day.date === constraint.target_date);
                if (dayIndex !== -1) {
                    constraintData.day_index = dayIndex;
                    processedConstraints[constraint.constraint_type].push(constraintData);
                }
            } else if (constraint.applies_to === 'day_of_week') {
                days.forEach((day, dayIndex) => {
                    if (day.dayOfWeek === constraint.day_of_week) {
                        processedConstraints[constraint.constraint_type].push({
                            ...constraintData,
                            day_index: dayIndex
                        });
                    }
                });
            }
        });

        return {
            employees: employees.map(e => e.toJSON()),
            shifts: shifts.map(s => s.toJSON()),
            positions: positions.map(p => p.toJSON()),
            days,
            settings: settings.toJSON ? settings.toJSON() : settings,
            constraints: processedConstraints
        };
    }

    async callPythonOptimizer(data) {
        const tempDir = path.join(__dirname, '..', 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const sessionId = uuidv4();
        const inputFile = path.join(tempDir, `input_${sessionId}.json`);
        const outputFile = path.join(tempDir, `output_${sessionId}.json`);
        const pythonScript = path.join(__dirname, 'cp_sat_optimizer.py');

        try {
            // Записать входные данные
            await fs.writeFile(inputFile, JSON.stringify(data, null, 2));

            // Запустить Python скрипт
            const result = await this.runPythonScript(pythonScript, inputFile, outputFile);

            // Прочитать результат
            const outputData = await fs.readFile(outputFile, 'utf8');
            const parsedResult = JSON.parse(outputData);

            // Очистить временные файлы
            await Promise.all([
                fs.unlink(inputFile).catch(() => {}),
                fs.unlink(outputFile).catch(() => {})
            ]);

            return parsedResult;

        } catch (error) {
            // Очистить временные файлы при ошибке
            await Promise.all([
                fs.unlink(inputFile).catch(() => {}),
                fs.unlink(outputFile).catch(() => {})
            ]);
            throw error;
        }
    }

    runPythonScript(scriptPath, inputFile, outputFile) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                scriptPath,
                '--input', inputFile,
                '--output', outputFile
            ]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('[CP-SAT Bridge] Python script output:', stdout);
                    resolve({ code, stdout, stderr });
                } else {
                    console.error('[CP-SAT Bridge] Python script failed:', stderr);
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    async saveSchedule(siteId, weekStart, assignments) {
        const { Schedule, ScheduleAssignment } = require('../models/associations');
        const { Op } = require('sequelize');
        const dayjs = require('dayjs');

        const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

        // Очистка старых назначений
        console.log(`[CP-SAT Bridge] Clearing existing assignments for week ${weekStart}...`);

        const existingSchedules = await Schedule.findAll({
            where: {
                site_id: siteId,
                start_date: {
                    [Op.between]: [weekStart, weekEnd]
                }
            }
        });

        for (const schedule of existingSchedules) {
            await ScheduleAssignment.destroy({
                where: { schedule_id: schedule.id }
            });
            await schedule.destroy();
        }

        const scheduleData = {
            start_date: new Date(weekStart),
            end_date: new Date(weekEnd),
            site_id: siteId,
            status: 'draft',
            text_file: JSON.stringify({
                generated_at: new Date().toISOString(),
                algorithm: 'CP-SAT-Python',
                timezone: 'Asia/Jerusalem'
            })
        };

        const schedule = await Schedule.create(scheduleData);

        const scheduleAssignments = assignments.map((assignment, index) => ({
            schedule_id: schedule.id,
            emp_id: assignment.emp_id,
            shift_id: assignment.shift_id,
            position_id: assignment.position_id,
            work_date: new Date(assignment.date),
            status: 'scheduled',
            notes: `Generated by CP-SAT optimizer - ${index + 1}`
        }));

        await ScheduleAssignment.bulkCreate(scheduleAssignments);

        return {
            schedule_id: schedule.id,
            assignments_count: scheduleAssignments.length,
            week: `${weekStart} - ${weekEnd}`
        };
    }

    calculateScheduleStats(assignments) {
        const employeeStats = {};

        assignments.forEach(assignment => {
            if (!employeeStats[assignment.emp_id]) {
                employeeStats[assignment.emp_id] = {
                    total_shifts: 0,
                    shift_types: {}
                };
            }

            employeeStats[assignment.emp_id].total_shifts++;

            const shiftId = assignment.shift_id;
            if (!employeeStats[assignment.emp_id].shift_types[shiftId]) {
                employeeStats[assignment.emp_id].shift_types[shiftId] = 0;
            }
            employeeStats[assignment.emp_id].shift_types[shiftId]++;
        });

        return {
            total_assignments: assignments.length,
            employees_assigned: Object.keys(employeeStats).length,
            employee_stats: employeeStats,
            algorithm: 'CP-SAT-Python'
        };
    }

    static async generateOptimalSchedule(siteId, weekStart) {
        try {
            console.log(`[CP-SAT Bridge] Starting optimization for site ${siteId}, week ${weekStart}`);

            const bridge = new CPSATBridge();

            // 1. Подготовка данных
            const data = await bridge.prepareScheduleData(siteId, weekStart);

            // 2. Вызов Python оптимизатора
            const pythonResult = await bridge.callPythonOptimizer(data);

            if (!pythonResult.success) {
                return {
                    success: false,
                    error: pythonResult.error,
                    algorithm: 'CP-SAT-Python'
                };
            }

            // 3. Сохранение результатов
            const savedSchedule = await bridge.saveSchedule(siteId, weekStart, pythonResult.schedule);

            return {
                success: true,
                schedule: savedSchedule,
                stats: bridge.calculateScheduleStats(pythonResult.schedule),
                algorithm: 'CP-SAT-Python',
                solve_time: pythonResult.solve_time,
                status: pythonResult.status
            };

        } catch (error) {
            console.error('[CP-SAT Bridge] Error:', error);
            return {
                success: false,
                error: error.message,
                algorithm: 'CP-SAT-Python'
            };
        }
    }
}

module.exports = CPSATBridge;