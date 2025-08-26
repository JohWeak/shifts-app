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

     async generateOptimalSchedule(siteId, weekStart, transaction = null) {

        try {
            console.log(`[CP-SAT Bridge] Starting optimization for site ${siteId}, week ${weekStart}`);

            const data = await this.prepareScheduleData(siteId, weekStart, transaction);

            const pythonResult = await this.callPythonOptimizer(data);

            if (!pythonResult.success) {
                return {
                    success: false,
                    error: pythonResult.error,
                    algorithm: 'CP-SAT-Python'
                };
            }

            const savedSchedule = await this.saveSchedule(siteId, weekStart, pythonResult.schedule, transaction);

            return {
                success: true,
                schedule: {
                    schedule_id: savedSchedule.schedule_id,
                    assignments_count: savedSchedule.assignments_count,
                    week_start: savedSchedule.week_start,
                    week_end: savedSchedule.week_end
                },
                stats: {
                    basic: this.calculateScheduleStats(pythonResult.schedule),
                    detailed: savedSchedule.statistics
                },
                algorithm: 'CP-SAT-Python',
                solve_time: pythonResult.solve_time,
                status: pythonResult.status,
                coverage_rate: pythonResult.coverage_rate || 100,
                shortage_count: pythonResult.shortage_count || 0,
                issues: savedSchedule.statistics?.issues || []
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
            PermanentConstraint,
            LegalConstraint,
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
                        where: {status: 'active'},
                        required: false
                    },
                    {
                        model: PermanentConstraint,
                        as: 'permanentConstraints',
                        where: {is_active: true},
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
                where: {is_active: true},
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
                    where: {is_active: true},
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

            const shiftsArray = [];
            const shiftRequirementsMap = {};
            const positionShiftsMap = {};

            positions.forEach(position => {
                if (!positionShiftsMap[position.pos_id]) {
                    positionShiftsMap[position.pos_id] = [];
                }

                position.shifts?.forEach(posShift => {
                    // Create shift data with position tracking
                    const shiftData = {
                        shift_id: posShift.id,
                        shift_name: posShift.shift_name,
                        start_time: posShift.start_time,
                        duration: posShift.duration_hours || 8,
                        shift_type: this.determineShiftType(posShift.start_time),
                        is_night_shift: posShift.is_night_shift || false,
                        position_id: position.pos_id
                    };

                    // Only add if not already added
                    if (!shiftsArray.find(s => s.shift_id === posShift.id)) {
                        shiftsArray.push(shiftData);
                    }
                    // Track this shift for this position
                    positionShiftsMap[position.pos_id].push(posShift.id);

                    // Process shift requirements for each day
                    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                        const date = new Date(weekStart);
                        date.setDate(date.getDate() + dayOffset);
                        const dayOfWeek = date.getDay();
                        const dateStr = date.toISOString().split('T')[0];

                        // Default requirement
                        let requiredStaff = 0;

                        // Find requirement for this day
                        if (posShift.requirements && posShift.requirements.length > 0) {
                            // Сначала ищем конкретное требование для этого дня недели
                            let dayRequirement = posShift.requirements.find(req => {
                                if (!req.is_recurring) {
                                    return req.specific_date === dateStr;
                                }
                                return req.day_of_week === dayOfWeek;
                            });

                            // Если не нашли конкретное, ищем общее (day_of_week = null означает ВСЕ дни)
                            if (!dayRequirement) {
                                dayRequirement = posShift.requirements.find(req => {
                                    return req.is_recurring && req.day_of_week === null;
                                });
                            }

                            if (dayRequirement) {
                                requiredStaff = dayRequirement.required_staff_count || 0;
                            }
                        }

                        // Create unique key for this position-shift-date combination
                        if (requiredStaff > 0) {
                            const key = `${position.pos_id}-${posShift.id}-${dateStr}`;
                            shiftRequirementsMap[key] = {
                                position_id: position.pos_id,
                                shift_id: posShift.id,
                                date: dateStr,
                                day_index: dayOffset,
                                required_staff: requiredStaff,
                                is_working_day: true
                            };

                            console.log(`[CP-SAT Bridge] Requirement for ${position.pos_name} - ${posShift.shift_name} on ${dateStr}: ${requiredStaff} staff`);
                        }
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

            // Format position data - include required employees info
            const positionsData = positions.map(position => {
                // Calculate total required assignments for this position
                let totalRequired = 0;
                for (const key in shiftRequirementsMap) {
                    const req = shiftRequirementsMap[key];
                    if (req.position_id === position.pos_id) {
                        totalRequired += req.required_staff;
                    }
                }

                return {
                    pos_id: position.pos_id,
                    pos_name: position.pos_name,
                    profession: position.profession,
                    num_of_emp: position.num_of_emp || 1, // Legacy field
                    total_required: totalRequired
                };
            });

            // Generate days array
            const days = [];
            const startDate = new Date(weekStart);

            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);

                days.push({
                    date: currentDate.toISOString().split('T')[0],
                    day_name: currentDate.toLocaleDateString('en-US', {weekday: 'long'}),
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
                position_shifts_map: positionShiftsMap,
                days: days,
                constraints: constraintsData,
                existing_assignments: existingAssignments,
                shift_requirements: shiftRequirementsMap,
                settings: settings
            };

            console.log('[CP-SAT Bridge] Data prepared:', {
                employees: employeesData.length,
                shifts: shiftsArray.length,
                positions: positionsData.length,
                position_shifts_map: positionShiftsMap,
                days: days.length,
                shift_requirements_count: Object.keys(shiftRequirementsMap).length
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
                            const constraintData = {
                                emp_id: emp.emp_id,
                                day_index: index,
                                shift_id: permConstraint.shift_id || null,
                                constraint_type: permConstraint.constraint_type,
                                is_permanent: true,
                                approved_by: permConstraint.approver ?
                                    `${permConstraint.approver.first_name} ${permConstraint.approver.last_name}` :
                                    permConstraint.approved_by_name || 'Unknown',
                                approved_at: permConstraint.approved_at
                            };

                            if (permConstraint.constraint_type === 'cannot_work') {
                                permanentCannotWork.push(constraintData);
                                console.log(`[Bridge] Permanent constraint: emp ${emp.emp_id} cannot work ${dayName} shift ${permConstraint.shift_id || 'ALL'}`);
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
        const {ScheduleAssignment, PositionShift, Position} = this.db;

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
                // Use backend/temp directory, not src/temp
                const tempDir = path.join(__dirname, '..', '..', 'temp');
                await fs.mkdir(tempDir, {recursive: true});

                const tempFileName = `schedule_data_${uuidv4()}.json`;
                const tempFilePath = path.join(tempDir, tempFileName);
                const resultFilePath = tempFilePath.replace('.json', '_result.json');

                console.log(`[CP-SAT Bridge] Temp directory: ${tempDir}`);
                console.log(`[CP-SAT Bridge] Temp file: ${tempFilePath}`);

                // Write data to file
                await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf8');

                // Verify file exists
                try {
                    await fs.access(tempFilePath);
                    console.log(`[CP-SAT Bridge] File created successfully`);
                } catch (err) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(`Failed to create temp file: ${err.message}`);
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
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error(`Python process exited with code ${code}: ${errorData}`);
                        }

                        // Найдём JSON в выводе Python
                        const jsonMatch = outputData.match(/\{[^{}]*"success"[^{}]*\}/);
                        if (!jsonMatch) {
                            // noinspection ExceptionCaughtLocallyJS
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
                                // noinspection ExceptionCaughtLocallyJS
                                throw new Error(`Could not read result file: ${fileError.message}`);
                            }
                        } else {
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Python optimizer reported failure');
                        }
                    } catch (error) {
                        console.error('[CP-SAT Bridge] Error processing result:', error);
                        reject(error);
                    } finally {
                        // Clean up temp files
                        // try {
                        //     await fs.unlink(tempFilePath).catch(() => {});
                        //     await fs.unlink(resultFilePath).catch(() => {});
                        // } catch (err) {
                        //     console.error('Error cleaning temp files:', err);
                        // }
                    }
                });

            } catch (error) {
                console.error('[CP-SAT Bridge] Setup error:', error);
                reject(error);
            }
        });
    }

    // backend/src/services/cp-sat-bridge.service.js

    /**
     * Save schedule to database
     */
    async saveSchedule(siteId, weekStart, scheduleData, transaction = null) {
        const {Schedule, ScheduleAssignment} = this.db;

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
            }, {transaction});

            const assignments = [];

            for (const assignment of scheduleData) {
                // Since we're now using real shift IDs, no mapping needed!
                assignments.push({
                    schedule_id: newSchedule.id,
                    emp_id: assignment.emp_id,
                    shift_id: assignment.shift_id, // Already the real ID
                    position_id: assignment.position_id,
                    work_date: assignment.date,
                    status: 'scheduled',
                    notes: `Generated by CP-SAT optimizer - ${assignment.assignment_index}`
                });
            }

            if (assignments.length > 0) {
                await ScheduleAssignment.bulkCreate(assignments, {transaction});
            }

            console.log(`[CP-SAT Bridge] Saved schedule with ${assignments.length} assignments`);

            // Calculate detailed statistics
            const stats = await this.calculateDetailedStats(
                newSchedule.id,
                siteId,
                weekStart,
                assignments,
                transaction
            );

            return {
                schedule_id: newSchedule.id,
                assignments_count: assignments.length,
                week_start: weekStart,
                week_end: weekEnd.format('YYYY-MM-DD'),
                statistics: stats
            };

        } catch (error) {
            console.error('[CP-SAT Bridge] Error saving schedule:', error);
            throw error;
        }
    }

    /**
     * Calculate detailed schedule statistics for dashboard
     */
    async calculateDetailedStats(scheduleId, siteId, weekStart, assignments, transaction = null) {
        const {Position, PositionShift, ShiftRequirement, Employee} = this.db;

        try {
            // Load positions with requirements
            const positions = await Position.findAll({
                where: {site_id: siteId, is_active: true},
                include: [{
                    model: PositionShift,
                    as: 'shifts',
                    where: {is_active: true},
                    required: false,
                    include: [{
                        model: ShiftRequirement,
                        as: 'requirements',
                        required: false
                    }]
                }],
                transaction
            });

            // Load employees
            const employees = await Employee.findAll({
                where: {work_site_id: siteId, status: 'active'},
                attributes: ['emp_id', 'first_name', 'last_name', 'default_position_id'],
                transaction
            });

            // Calculate required assignments
            let totalRequired = 0;
            const requirementsByDay = {};
            const requirementsByPosition = {};

            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + dayOffset);
                const dateStr = date.toISOString().split('T')[0];
                const dayOfWeek = date.getDay();

                requirementsByDay[dateStr] = {required: 0, assigned: 0};

                positions.forEach(position => {
                    if (!requirementsByPosition[position.pos_id]) {
                        requirementsByPosition[position.pos_id] = {
                            name: position.pos_name,
                            required: 0,
                            assigned: 0,
                            coverage: 0
                        };
                    }

                    position.shifts?.forEach(shift => {
                        let requiredStaff = 0;

                        if (shift.requirements?.length > 0) {
                            const dayReq = shift.requirements.find(r =>
                                r.is_recurring && (r.day_of_week === dayOfWeek || r.day_of_week === null)
                            );
                            if (dayReq) {
                                requiredStaff = dayReq.required_staff_count || 0;
                            }
                        }

                        totalRequired += requiredStaff;
                        requirementsByDay[dateStr].required += requiredStaff;
                        requirementsByPosition[position.pos_id].required += requiredStaff;
                    });
                });
            }

            // Count actual assignments
            const assignmentsByEmployee = {};
            const assignmentsByShift = {};
            const assignmentsByPosition = {};

            assignments.forEach(assignment => {
                // By day
                if (requirementsByDay[assignment.work_date]) {
                    requirementsByDay[assignment.work_date].assigned++;
                }

                // By position
                if (requirementsByPosition[assignment.position_id]) {
                    requirementsByPosition[assignment.position_id].assigned++;
                }

                // By employee
                if (!assignmentsByEmployee[assignment.emp_id]) {
                    const emp = employees.find(e => e.emp_id === assignment.emp_id);
                    assignmentsByEmployee[assignment.emp_id] = {
                        name: emp ? `${emp.first_name} ${emp.last_name}` : `Employee ${assignment.emp_id}`,
                        shifts: 0,
                        hours: 0,
                        position_match: 0
                    };
                }
                assignmentsByEmployee[assignment.emp_id].shifts++;
                assignmentsByEmployee[assignment.emp_id].hours += 8; // Assuming 8-hour shifts

                // Check position match
                const emp = employees.find(e => e.emp_id === assignment.emp_id);
                if (emp && emp.default_position_id === assignment.position_id) {
                    assignmentsByEmployee[assignment.emp_id].position_match++;
                }

                // By shift
                if (!assignmentsByShift[assignment.shift_id]) {
                    assignmentsByShift[assignment.shift_id] = 0;
                }
                assignmentsByShift[assignment.shift_id]++;
            });

            // Calculate coverage percentages
            Object.keys(requirementsByPosition).forEach(posId => {
                const pos = requirementsByPosition[posId];
                pos.coverage = pos.required > 0
                    ? Math.round((pos.assigned / pos.required) * 100)
                    : 100;
            });

            Object.keys(requirementsByDay).forEach(date => {
                const day = requirementsByDay[date];
                day.coverage = day.required > 0
                    ? Math.round((day.assigned / day.required) * 100)
                    : 100;
            });

            // Calculate overall metrics
            const overallCoverage = totalRequired > 0
                ? Math.round((assignments.length / totalRequired) * 100)
                : 100;

            const avgShiftsPerEmployee = Object.keys(assignmentsByEmployee).length > 0
                ? assignments.length / Object.keys(assignmentsByEmployee).length
                : 0;

            // Find issues
            const issues = [];

            // Check for understaffed days
            Object.entries(requirementsByDay).forEach(([date, data]) => {
                if (data.assigned < data.required) {
                    issues.push({
                        type: 'understaffed_day',
                        severity: 'high',
                        date,
                        shortage: data.required - data.assigned
                    });
                }
            });

            // Check for understaffed positions
            Object.entries(requirementsByPosition).forEach(([posId, data]) => {
                if (data.coverage < 100) {
                    issues.push({
                        type: 'understaffed_position',
                        severity: data.coverage < 80 ? 'high' : 'medium',
                        position: data.name,
                        coverage: data.coverage
                    });
                }
            });

            // Check for overworked employees
            Object.entries(assignmentsByEmployee).forEach(([empId, data]) => {
                if (data.hours > 48) {
                    issues.push({
                        type: 'overworked_employee',
                        severity: 'medium',
                        employee: data.name,
                        hours: data.hours
                    });
                }
            });

            return {
                summary: {
                    total_assignments: assignments.length,
                    total_required: totalRequired,
                    overall_coverage: overallCoverage,
                    employees_used: Object.keys(assignmentsByEmployee).length,
                    positions_covered: Object.keys(requirementsByPosition).length,
                    avg_shifts_per_employee: Math.round(avgShiftsPerEmployee * 10) / 10,
                    issues_count: issues.length
                },
                by_day: requirementsByDay,
                by_position: requirementsByPosition,
                by_employee: assignmentsByEmployee,
                by_shift: assignmentsByShift,
                issues,
                metadata: {
                    schedule_id: scheduleId,
                    site_id: siteId,
                    week_start: weekStart,
                    calculated_at: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('[CP-SAT Bridge] Error calculating stats:', error);
            return {
                summary: {
                    total_assignments: assignments.length,
                    error: error.message
                }
            };
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

    /**
     * Get schedule statistics for dashboard (public method)
     */
    async getScheduleStatistics(scheduleId) {
        const {ScheduleAssignment, Schedule} = this.db;

        try {
            const schedule = await Schedule.findByPk(scheduleId);
            if (!schedule) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('Schedule not found');
            }

            const assignments = await ScheduleAssignment.findAll({
                where: {schedule_id: scheduleId},
                raw: true
            });

            return await this.calculateDetailedStats(
                scheduleId,
                schedule.site_id,
                schedule.start_date,
                assignments
            );

        } catch (error) {
            console.error('[CP-SAT Bridge] Error getting statistics:', error);
            throw error;
        }
    }
}
const cpSatBridge = new CPSATBridge(db);
module.exports = cpSatBridge;
