// backend/src/services/cp-sat-bridge.service.js
// backend/src/services/cp-sat-bridge.service.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const dayjs = require('dayjs');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const CONSTRAINTS = require('../config/scheduling-constraints');

class CPSATBridge {
    constructor(database) {
        this.db = database || db;
    }

    static async generateOptimalSchedule(database, siteId, weekStart, transaction = null) {
        const bridge = new CPSATBridge(database || db);

        try {
            console.log(`[CP-SAT Bridge] Starting optimization for site ${siteId}, week ${weekStart}`);

            const data = await bridge.prepareScheduleData(siteId, weekStart, transaction);

            const pythonResult = await bridge.callPythonOptimizer(data);

            if (!pythonResult.success) {
                return {
                    success: false,
                    error: pythonResult.error,
                    algorithm: 'CP-SAT-Python'
                };
            }

            const savedSchedule = await bridge.saveSchedule(siteId, weekStart, pythonResult.schedule, transaction);

            return {
                success: true,
                schedule: savedSchedule,
                stats: bridge.calculateScheduleStats(pythonResult.schedule),
                algorithm: 'CP-SAT-Python',
                solve_time: pythonResult.solve_time,
                status: pythonResult.status,
                coverage_rate: pythonResult.coverage_rate || 100,
                shortage_count: pythonResult.shortage_count || 0
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

    async prepareScheduleData(siteId, weekStart, transaction = null) {
        console.log(`[CP-SAT Bridge] Preparing data for site ${siteId}, week ${weekStart}`);

        const {
            Employee,
            Position,
            PositionShift,
            ShiftRequirement,
            EmployeeConstraint,
            PermanentConstraint, // Add permanent constraints
            LegalConstraint, // Add legal constraints
            ScheduleAssignment
        } = this.db;

        try {
            // Get employees with all constraint types
            const employees = await Employee.findAll({
                where: {
                    status: 'active',
                    role: 'employee',
                    work_site_id: siteId
                },
                include: [
                    {
                        model: Position,
                        as: 'defaultPosition'
                    },
                    {
                        model: EmployeeConstraint,
                        as: 'constraints',
                        where: { status: 'active' },
                        required: false
                    },
                    {
                        model: PermanentConstraint,
                        as: 'permanentConstraints',
                        where: { is_active: true },
                        required: false,
                        include: [{
                            model: Employee,
                            as: 'approver',
                            attributes: ['emp_id', 'first_name', 'last_name']
                        }]
                    }
                ],
                transaction
            });

            console.log(`[CP-SAT Bridge] Found ${employees.length} active employees for site ${siteId}`);

            // Get legal constraints
            const legalConstraints = await LegalConstraint.findAll({
                where: { is_active: true },
                transaction
            });

            // Get positions with shifts and requirements
            const positions = await Position.findAll({
                where: {
                    site_id: siteId,
                    is_active: true
                },
                include: [{
                    model: PositionShift,
                    as: 'shifts',
                    where: { is_active: true },
                    required: false,
                    include: [{
                        model: ShiftRequirement,
                        as: 'requirements',
                        required: false
                    }],
                }],
                order: [['pos_name', 'ASC']],
                transaction
            });

            console.log(`[CP-SAT Bridge] Found ${positions.length} active positions`);

            // Create shift mapping for backward compatibility
            const shiftIdMapping = {};
            let temporaryShiftId = 1;

            const shiftsMap = new Map();
            const shiftsArray = [];

            positions.forEach(position => {
                position.shifts?.forEach(posShift => {
                    if (!shiftsMap.has(posShift.id)) {
                        const tempId = temporaryShiftId++;
                        shiftIdMapping[tempId] = posShift.id;

                        const shiftData = {
                            shift_id: tempId,
                            real_shift_id: posShift.id,
                            shift_name: posShift.shift_name,
                            start_time: posShift.start_time,
                            duration: posShift.duration_hours,
                            shift_type: this.determineShiftType(posShift.start_time),
                            is_night_shift: posShift.is_night_shift || false
                        };
                        shiftsMap.set(posShift.id, shiftData);
                        shiftsArray.push(shiftData);
                    }
                });
            });

            this.shiftIdMapping = shiftIdMapping;

            // Format employee data
            const employeesData = employees
                .filter(emp => emp.default_position_id !== null)
                .map(emp => ({
                    emp_id: emp.emp_id,
                    name: `${emp.first_name} ${emp.last_name}`,
                    default_position_id: emp.default_position_id,
                    status: emp.status
                }));

            // Format position data
            const positionsData = positions.map(position => ({
                pos_id: position.pos_id,
                pos_name: position.pos_name,
                profession: position.profession,
                num_of_emp: position.num_of_emp
            }));

            // Generate days array
            const days = [];
            const startDate = new Date(weekStart);

            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);

                days.push({
                    date: currentDate.toISOString().split('T')[0],
                    day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    day_index: i,
                    weekday: currentDate.getDay()
                });
            }

            // Process all constraint types
            const constraintsData = await this.processConstraints(employees, days, shiftsArray, legalConstraints);

            const existingAssignments = await this.getExistingAssignments(
                employees.map(e => e.emp_id),
                weekStart,
                transaction
            );

            const settings = {
                week_start: weekStart,
                site_id: siteId,
                hard_constraints: CONSTRAINTS.HARD_CONSTRAINTS,
                soft_constraints: CONSTRAINTS.SOFT_CONSTRAINTS,
                optimization_weights: CONSTRAINTS.OPTIMIZATION_WEIGHTS,
                max_solve_time: CONSTRAINTS.SOLVER_SETTINGS.MAX_TIME_SECONDS || 120,
                enable_overtime: CONSTRAINTS.SOLVER_SETTINGS.enable_overtime,
                enable_weekend_work: CONSTRAINTS.SOLVER_SETTINGS.enable_weekend_work,
                strict_rest_requirements: CONSTRAINTS.SOLVER_SETTINGS.strict_rest_requirements
            };

            const preparedData = {
                employees: employeesData,
                shifts: shiftsArray,
                positions: positionsData,
                days: days,
                constraints: constraintsData,
                existing_assignments: existingAssignments,
                settings: settings
            };

            console.log('[CP-SAT Bridge] Data prepared:', {
                employees: employeesData.length,
                shifts: shiftsArray.length,
                positions: positionsData.length,
                days: days.length,
                cannot_work_constraints: constraintsData.cannot_work.length,
                prefer_work_constraints: constraintsData.prefer_work.length,
                permanent_cannot_work: constraintsData.permanent_cannot_work.length,
                legal_constraints: constraintsData.legal_constraints.length
            });

            return preparedData;

        } catch (error) {
            console.error('[CP-SAT Bridge] Error preparing data:', error);
            throw error;
        }
    }

    determineShiftType(startTime) {
        const hour = parseInt(startTime.split(':')[0]);

        if (hour >= 6 && hour < 14) {
            return 'morning';
        } else if (hour >= 14 && hour < 22) {
            return 'day';
        } else {
            return 'night';
        }
    }

    async processConstraints(employees, days, shifts, legalConstraints) {
        const cannotWork = [];
        const preferWork = [];
        const permanentCannotWork = [];
        const legalConstraintData = [];

        // Process employee constraints
        for (const emp of employees) {
            // Process temporary constraints
            if (emp.constraints) {
                for (const constraint of emp.constraints) {
                    const constraintDays = [];

                    if (constraint.target_date) {
                        const targetDate = dayjs(constraint.target_date).format('YYYY-MM-DD');
                        const dayIndex = days.findIndex(d => d.date === targetDate);
                        if (dayIndex !== -1) {
                            constraintDays.push(dayIndex);
                        }
                    } else if (constraint.day_of_week !== null) {
                        // day_of_week is 0-6 (Sunday-Saturday)
                        const dayIndex = days.findIndex(d => d.weekday === constraint.day_of_week);
                        if (dayIndex !== -1) {
                            constraintDays.push(dayIndex);
                        }
                    }

                    for (const dayIndex of constraintDays) {
                        // Need to map real shift_id to temporary shift_id for Python
                        let mappedShiftId = null;
                        if (constraint.shift_id) {
                            // Find the temporary ID for this real shift ID
                            for (const [tempId, realId] of Object.entries(this.shiftIdMapping)) {
                                if (realId === constraint.shift_id) {
                                    mappedShiftId = parseInt(tempId);
                                    break;
                                }
                            }
                        }

                        const constraintData = {
                            emp_id: emp.emp_id,
                            day_index: dayIndex,
                            shift_id: mappedShiftId, // Use mapped ID
                            constraint_type: constraint.constraint_type,
                            reason: constraint.reason
                        };

                        if (constraint.constraint_type === 'cannot_work') {
                            cannotWork.push(constraintData);
                        } else if (constraint.constraint_type === 'prefer_work') {
                            preferWork.push(constraintData);
                        }
                    }
                }
            }

            // Process permanent constraints
            if (emp.permanentConstraints) {
                for (const permConstraint of emp.permanentConstraints) {
                    days.forEach((day, index) => {
                        const dayName = day.day_name.toLowerCase();
                        if (dayName === permConstraint.day_of_week) {
                            // Map real shift_id to temporary shift_id
                            let mappedShiftId = null;
                            if (permConstraint.shift_id) {
                                for (const [tempId, realId] of Object.entries(this.shiftIdMapping)) {
                                    if (realId === permConstraint.shift_id) {
                                        mappedShiftId = parseInt(tempId);
                                        break;
                                    }
                                }
                            }

                            const constraintData = {
                                emp_id: emp.emp_id,
                                day_index: index,
                                shift_id: mappedShiftId,
                                constraint_type: permConstraint.constraint_type,
                                is_permanent: true,
                                approved_by: permConstraint.approver ?
                                    `${permConstraint.approver.first_name} ${permConstraint.approver.last_name}` :
                                    'Unknown',
                                approved_at: permConstraint.approved_at
                            };

                            if (permConstraint.constraint_type === 'cannot_work') {
                                permanentCannotWork.push(constraintData);
                            }
                        }
                    });
                }
            }
        }

        // Process legal constraints
        for (const legal of legalConstraints) {
            legalConstraintData.push({
                constraint_type: legal.constraint_type,
                scope: legal.scope,
                value: legal.value,
                description: legal.description
            });
        }

        console.log('[CP-SAT Bridge] Processed constraints:', {
            cannot_work: cannotWork.length,
            prefer_work: preferWork.length,
            permanent_cannot_work: permanentCannotWork.length,
            sample_cannot_work: cannotWork.slice(0, 3),
            sample_permanent: permanentCannotWork.slice(0, 3)
        });

        return {
            cannot_work: cannotWork,
            prefer_work: preferWork,
            permanent_cannot_work: permanentCannotWork,
            legal_constraints: legalConstraintData
        };
    }

    /**
     * Get existing assignments for the week
     */
    async getExistingAssignments(employeeIds, weekStart, transaction = null) {
        const { ScheduleAssignment, PositionShift, Position } = this.db;

        const weekEnd = dayjs(weekStart).add(6, 'days').format('YYYY-MM-DD');

        const assignments = await ScheduleAssignment.findAll({
            where: {
                emp_id: employeeIds,
                work_date: {
                    [db.Sequelize.Op.between]: [weekStart, weekEnd]
                }
            },
            include: [
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'duration_hours']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name']
                }
            ], transaction
        });

        return assignments.map(a => ({
            emp_id: a.emp_id,
            date: a.work_date,
            shift_id: a.shift_id,
            position_id: a.position_id
        }));
    }

    /**
     * Call Python optimizer
     */
    async callPythonOptimizer(data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Correct temp directory path
                const tempDir = path.join(process.cwd(), 'temp');
                await fs.mkdir(tempDir, { recursive: true });

                const tempFileName = `schedule_data_${uuidv4()}.json`;
                const tempFilePath = path.join(tempDir, tempFileName);
                const resultFilePath = tempFilePath.replace('.json', '_result.json');

                // Write data to file
                await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2));
                console.log(`[CP-SAT Bridge] Created temp file: ${tempFilePath}`);

                // Verify file exists
                const fileExists = await fs.access(tempFilePath).then(() => true).catch(() => false);
                if (!fileExists) {
                    throw new Error('Failed to create temp file');
                }

                // Path to Python script
                const pythonScriptPath = path.join(__dirname, 'cp_sat_optimizer.py');

                // Spawn Python process
                const pythonProcess = spawn('python', [pythonScriptPath, tempFilePath]);

                let outputData = '';
                let errorData = '';
                let processCompleted = false;

                pythonProcess.stdout.on('data', (data) => {
                    const chunk = data.toString();
                    console.log('[Python stdout]:', chunk);
                    outputData += chunk;
                });

                pythonProcess.stderr.on('data', (data) => {
                    const chunk = data.toString();
                    console.error('[Python stderr]:', chunk);
                    errorData += chunk;
                });

                pythonProcess.on('error', (error) => {
                    console.error('[Python process error]:', error);
                    if (!processCompleted) {
                        processCompleted = true;
                        reject(new Error(`Failed to start Python process: ${error.message}`));
                    }
                });

                pythonProcess.on('close', async (code) => {
                    if (processCompleted) return;
                    processCompleted = true;

                    console.log(`[Python process] Exit code: ${code}`);

                    try {
                        if (code !== 0) {
                            throw new Error(`Python process exited with code ${code}: ${errorData}`);
                        }

                        // Найдём JSON в выводе Python
                        const jsonMatch = outputData.match(/\{[^{}]*"success"[^{}]*\}/);
                        if (!jsonMatch) {
                            throw new Error('No JSON found in Python output');
                        }

                        const statusResult = JSON.parse(jsonMatch[0]);
                        console.log('[CP-SAT Bridge] Status result:', statusResult);

                        if (statusResult.success && statusResult.result_file) {
                            // Read the actual result from file
                            try {
                                const resultData = await fs.readFile(resultFilePath, 'utf8');
                                const result = JSON.parse(resultData);

                                console.log(`[CP-SAT Bridge] Successfully read result with ${result.schedule?.length || 0} assignments`);

                                resolve(result);
                            } catch (fileError) {
                                console.error('[CP-SAT Bridge] Error reading result file:', fileError);
                                throw new Error(`Could not read result file: ${fileError.message}`);
                            }
                        } else {
                            throw new Error('Python optimizer reported failure');
                        }
                    } catch (error) {
                        console.error('[CP-SAT Bridge] Error processing result:', error);
                        reject(error);
                    } finally {
                        // Clean up temp files
                        try {
                            await fs.unlink(tempFilePath).catch(() => {});
                            await fs.unlink(resultFilePath).catch(() => {});
                        } catch (err) {
                            console.error('Error cleaning temp files:', err);
                        }
                    }
                });

            } catch (error) {
                console.error('[CP-SAT Bridge] Setup error:', error);
                reject(error);
            }
        });
    }

    /**
     * Save schedule to database
     */
    async saveSchedule(siteId, weekStart, scheduleData,  transaction = null) {
        const { Schedule, ScheduleAssignment } = this.db;

        try {
            const weekEnd = dayjs(weekStart).add(6, 'days');

            // Create schedule record
            const newSchedule = await Schedule.create({
                site_id: siteId,
                start_date: weekStart,
                end_date: weekEnd.format('YYYY-MM-DD'),
                status: 'draft',
                metadata: {
                    generated_at: new Date().toISOString(),
                    algorithm: 'CP-SAT-Python',
                    timezone: 'Asia/Jerusalem'
                }
            }, { transaction });

            const assignments = [];

            for (const assignment of scheduleData) {
                // Преобразуем временный shift_id обратно в реальный position_shift id
                const realShiftId = this.shiftIdMapping[assignment.shift_id];

                if (!realShiftId) {
                    console.warn(`[CP-SAT Bridge] No mapping found for shift_id ${assignment.shift_id}, skipping`);
                    continue;
                }

                assignments.push({
                    schedule_id: newSchedule.id,
                    emp_id: assignment.emp_id,
                    shift_id: realShiftId, // Используем реальный ID из position_shifts
                    position_id: assignment.position_id,
                    work_date: assignment.date,
                    status: 'scheduled',
                    notes: `Generated by CP-SAT optimizer - ${assignment.assignment_index}`
                });
            }

            if (assignments.length > 0) {
                await ScheduleAssignment.bulkCreate(assignments, { transaction });
            }

            console.log(`[CP-SAT Bridge] Saved schedule with ${assignments.length} assignments`);

            return {
                schedule_id: newSchedule.id,
                assignments_count: assignments.length,
                week_start: weekStart,
                week_end: weekEnd.toISOString().split('T')[0]
            };

        } catch (error) {
            console.error('[CP-SAT Bridge] Error saving schedule:', error);
            throw error;
        }
    }

    /**
     * Calculate schedule statistics
     */
    calculateScheduleStats(schedule) {
        const stats = {
            total_assignments: schedule.length,
            employees_used: new Set(schedule.map(s => s.emp_id)).size,
            positions_covered: new Set(schedule.map(s => s.position_id)).size,
            shifts_covered: new Set(schedule.map(s => s.shift_id)).size,
            daily_distribution: {}
        };

        // Daily distribution
        schedule.forEach(assignment => {
            if (!stats.daily_distribution[assignment.date]) {
                stats.daily_distribution[assignment.date] = 0;
            }
            stats.daily_distribution[assignment.date]++;
        });

        return stats;
    }
}

module.exports = CPSATBridge;