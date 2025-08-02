// backend/src/services/schedule-generator.service.js
const dayjs = require('dayjs');
const db = require('../models');

class ScheduleGeneratorService {
    constructor(database) {
        this.db = database || db;
    }

    static async generateWeeklySchedule(database, siteId, weekStart, transaction = null) {
        const service = new ScheduleGeneratorService(database);

        try {
            console.log(`[ScheduleGeneratorService] Starting generation for site ${siteId}, week ${weekStart}`);

            // Prepare data with new structure
            const data = await service.prepareData(siteId, weekStart, transaction);

            // Generate schedule
            const result = await service.generateOptimalSchedule(data);

            if (!result.success) {
                return result;
            }

            // Save to database with transaction
            const savedSchedule = await service.saveSchedule(siteId, weekStart, result.schedule, transaction);

            return {
                success: true,
                schedule: savedSchedule,
                stats: result.stats,
                algorithm: 'simple'
            };

        } catch (error) {
            console.error('[ScheduleGeneratorService] Error:', error);
            return {
                success: false,
                error: error.message,
                algorithm: 'simple'
            };
        }
    }

    async prepareData(siteId, weekStart, transaction = null) {
        const {
            Employee,
            Position,
            PositionShift,
            ShiftRequirement,
            ScheduleSettings,
            EmployeeConstraint,
            PermanentConstraint, // Add permanent constraints
            WorkSite
        } = this.db;

        try {
            console.log(`[ScheduleGeneratorService] Preparing data for site ${siteId}, week ${weekStart}`);

            // Load positions with their shifts and requirements
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
                    }]
                }],
                transaction
            });

            // Flatten shifts and create maps
            const shifts = [];
            const shiftsMap = {};
            const shiftRequirementsMap = {};

            positions.forEach(position => {
                if (position.shifts) {
                    position.shifts.forEach(shift => {
                        shifts.push(shift);
                        shiftsMap[shift.id] = shift;

                        // Map requirements by position-shift
                        const key = `${position.pos_id}-${shift.id}`;
                        shiftRequirementsMap[key] = shift.requirements || [];
                    });
                }
            });

            console.log(`[ScheduleGeneratorService] Found ${positions.length} positions with ${shifts.length} shifts`);

            // Load employees with constraints
            const employees = await Employee.findAll({
                where: {
                    work_site_id: siteId,
                    status: 'active',
                    role: 'employee'
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
                        model: PermanentConstraint, // Include permanent constraints
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

            console.log(`[ScheduleGeneratorService] Found ${employees.length} active employees`);

            // Generate days
            const days = [];
            const startDate = dayjs(weekStart);

            for (let i = 0; i < 7; i++) {
                days.push(startDate.add(i, 'day').format('YYYY-MM-DD'));
            }

            // Get settings
            const settings = await ScheduleSettings.findOne({
                where: { site_id: siteId },
                transaction
            });

            // Process constraints (updated to include permanent)
            const constraints = await this.processConstraints(employees, days);

            return {
                weekStart,
                employees,
                shifts,
                positions,
                shiftsMap,
                shiftRequirementsMap,
                settings,
                constraints,
                days
            };

        } catch (error) {
            console.error('[ScheduleGeneratorService] Error preparing data:', error);
            throw error;
        }
    }

    calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let duration;
        if (endHour >= startHour) {
            duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        } else {
            // Overnight shift
            duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
        }

        return duration / 60; // Return hours
    }

    async processConstraints(employees, days) {
        const cannotWork = [];
        const preferWork = [];
        const permanentCannotWork = []; // New array for permanent constraints

        for (const emp of employees) {
            // Process temporary constraints
            if (emp.constraints) {
                for (const constraint of emp.constraints) {
                    // Find applicable days
                    const applicableDays = [];

                    if (constraint.target_date) {
                        // Specific date
                        const targetDate = dayjs(constraint.target_date).format('YYYY-MM-DD');
                        const dayIndex = days.indexOf(targetDate);
                        if (dayIndex !== -1) {
                            applicableDays.push(dayIndex);
                        }
                    } else if (constraint.day_of_week !== null) {
                        // Weekly recurring
                        days.forEach((day, index) => {
                            if (dayjs(day).day() === constraint.day_of_week) {
                                applicableDays.push(index);
                            }
                        });
                    }

                    // Add constraints
                    for (const dayIndex of applicableDays) {
                        const constraintData = {
                            emp_id: emp.emp_id,
                            day_index: dayIndex,
                            constraint_type: constraint.constraint_type,
                            shift_id: constraint.shift_id
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
                    // Find which days match the permanent constraint day_of_week
                    days.forEach((day, index) => {
                        const dayName = dayjs(day).format('dddd').toLowerCase();
                        if (dayName === permConstraint.day_of_week) {
                            const constraintData = {
                                emp_id: emp.emp_id,
                                day_index: index,
                                constraint_type: permConstraint.constraint_type,
                                shift_id: permConstraint.shift_id,
                                is_permanent: true,
                                approved_by: permConstraint.approver ?
                                    `${permConstraint.approver.first_name} ${permConstraint.approver.last_name}` :
                                    'Unknown',
                                approved_at: permConstraint.approved_at
                            };

                            if (permConstraint.constraint_type === 'cannot_work') {
                                permanentCannotWork.push(constraintData);
                            }
                            // Note: We might also want to handle 'prefer_work' permanent constraints
                        }
                    });
                }
            }
        }

        return { cannotWork, preferWork, permanentCannotWork };
    }

    async generateOptimalSchedule(data) {
        const {
            weekStart,
            employees,
            shifts,
            positions,
            shiftsMap,
            shiftRequirementsMap,
            settings,
            constraints,
            days
        } = data;

        const schedule = [];
        const existingSchedule = [];

        console.log(`[ScheduleGenerator] Starting generation for ${positions.length} positions, ${shifts.length} shifts`);
        console.log(`[ScheduleGenerator] Permanent constraints: ${constraints.permanentCannotWork.length}`);

        // For each day of the week
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = days[dayIndex];
            const dayOfWeek = dayjs(date).day(); // 0 = Sunday, 6 = Saturday

            console.log(`[ScheduleGenerator] Processing ${date} (day ${dayOfWeek})`);

            // For each position
            for (const position of positions) {
                // For each shift of this position
                for (const positionShift of position.shifts || []) {
                    const shift = shiftsMap[positionShift.id];
                    if (!shift) continue;

                    // Check if shift is on this day
                    const shiftDays = shift.days_of_week || [];
                    if (!shiftDays.includes(dayOfWeek)) continue;

                    // Get requirements
                    const key = `${position.pos_id}-${shift.id}`;
                    const requirements = shiftRequirementsMap[key] || [];
                    const requirement = requirements.find(r => r.day_of_week === dayOfWeek);
                    const requiredCount = requirement ? requirement.required_count : 0;

                    if (requiredCount === 0) continue;

                    console.log(`[ScheduleGenerator] Need ${requiredCount} employees for ${position.pos_name} - ${shift.shift_name}`);

                    // Find qualified available employees
                    const qualifiedEmployees = employees.filter(emp => {
                        return emp.default_position_id === position.pos_id;
                    });

                    // Filter out employees who cannot work
                    const availableEmployees = qualifiedEmployees.filter(emp => {
                        // Check permanent constraints FIRST (highest priority)
                        const hasPermanentConstraint = constraints.permanentCannotWork.some(c =>
                            c.emp_id === emp.emp_id &&
                            c.day_index === dayIndex &&
                            (!c.shift_id || c.shift_id === shift.id)
                        );

                        if (hasPermanentConstraint) {
                            console.log(`[ScheduleGenerator] ${emp.first_name} ${emp.last_name} has permanent constraint for this shift`);
                            return false;
                        }

                        // Check temporary constraints
                        const hasConstraint = constraints.cannotWork.some(c =>
                            c.emp_id === emp.emp_id &&
                            c.day_index === dayIndex &&
                            (!c.shift_id || c.shift_id === shift.id)
                        );

                        if (hasConstraint) {
                            return false;
                        }

                        // Check if already assigned
                        const alreadyAssigned = existingSchedule.some(s =>
                            s.emp_id === emp.emp_id &&
                            s.date === date
                        );

                        return !alreadyAssigned;
                    });

                    // Sort by preference (prefer work constraints first)
                    availableEmployees.sort((a, b) => {
                        const aPrefers = constraints.preferWork.some(c =>
                            c.emp_id === a.emp_id && c.day_index === dayIndex
                        );
                        const bPrefers = constraints.preferWork.some(c =>
                            c.emp_id === b.emp_id && c.day_index === dayIndex
                        );

                        if (aPrefers && !bPrefers) return -1;
                        if (!aPrefers && bPrefers) return 1;
                        return 0;
                    });

                    // Assign employees
                    const assignedCount = Math.min(requiredCount, availableEmployees.length);

                    for (let i = 0; i < assignedCount; i++) {
                        const employee = availableEmployees[i];
                        const assignment = {
                            emp_id: employee.emp_id,
                            date: date,
                            shift_id: shift.id,
                            position_id: position.pos_id
                        };

                        schedule.push(assignment);
                        existingSchedule.push(assignment);

                        console.log(`[ScheduleGenerator] Assigned ${employee.first_name} ${employee.last_name} to ${position.pos_name} - ${shift.shift_name} on ${date}`);
                    }

                    if (assignedCount < requiredCount) {
                        console.warn(`[ScheduleGenerator] Shortage: Only ${assignedCount}/${requiredCount} employees assigned for ${position.pos_name} - ${shift.shift_name} on ${date}`);
                    }
                }
            }
        }

        // Calculate statistics
        const stats = {
            total_assignments: schedule.length,
            employees_assigned: new Set(schedule.map(s => s.emp_id)).size,
            positions_covered: new Set(schedule.map(s => s.position_id)).size,
            shifts_covered: new Set(schedule.map(s => s.shift_id)).size
        };

        return {
            success: true,
            schedule,
            stats
        };
    }

    async saveSchedule(siteId, weekStart, scheduleData, transaction = null) {
        const { Schedule, ScheduleAssignment } = this.db;

        try {
            const weekEnd = dayjs(weekStart).add(6, 'days').format('YYYY-MM-DD');

            // Create schedule record
            const newSchedule = await Schedule.create({
                site_id: siteId,
                start_date: weekStart,
                end_date: weekEnd,
                status: 'draft',
                metadata: {
                    generated_at: new Date().toISOString(),
                    algorithm: 'simple',
                    timezone: 'Asia/Jerusalem'
                }
            }, { transaction });

            // Create assignments
            const assignments = scheduleData.map((assignment, index) => ({
                schedule_id: newSchedule.id,
                emp_id: assignment.emp_id,
                shift_id: assignment.shift_id,
                position_id: assignment.position_id,
                work_date: assignment.date,
                status: 'scheduled',
                notes: `Generated by simple algorithm - ${index}`
            }));

            if (assignments.length > 0) {
                await ScheduleAssignment.bulkCreate(assignments, { transaction });
            }

            console.log(`[ScheduleGeneratorService] Saved schedule with ${assignments.length} assignments`);

            return {
                schedule_id: newSchedule.id,
                assignments_count: assignments.length,
                week_start: weekStart,
                week_end: weekEnd
            };

        } catch (error) {
            console.error('[ScheduleGeneratorService] Error saving schedule:', error);
            throw error;
        }
    }
}

module.exports = ScheduleGeneratorService;