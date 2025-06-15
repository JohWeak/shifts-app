// backend/src/services/schedule-generator.service.js
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const db = require('../models');

class ScheduleGeneratorService {
    constructor(database) {
        this.db = database || db; // Используем переданную БД или импортированную
    }

    static async generateWeeklySchedule(database, siteId, weekStart) {
        const service = new ScheduleGeneratorService(database || db);
        try {
            console.log(`[ScheduleGeneratorService] Starting generation for site ${siteId}, week ${weekStart}`);

            const data = await service.prepareData(siteId, weekStart);
            if (!data.employees || data.employees.length === 0) {
                throw new Error('No employees found for scheduling');
            }

            const assignments = await service.generateOptimalSchedule(data);
            const savedSchedule = await service.saveSchedule(siteId, weekStart, assignments);

            return {
                success: true,
                schedule: savedSchedule,
                algorithm: 'simple',
                stats: {
                    total_assignments: assignments.length,
                    employees_assigned: new Set(assignments.map(a => a.emp_id)).size,
                    positions_count: data.positions.length,
                    shifts_count: data.shifts.length
                }
            };

        } catch(error) {
            console.error('[ScheduleGeneratorService] Error:', error);
            return {
                success: false,
                error: error.message,
                algorithm: 'simple'
            };
        }
    }

    /**
     * 2. Создаем метод для подготовки данных (как в CPSATBridge)
     */
    async prepareData(siteId, weekStart) {
        const {
            Employee,
            Shift,
            Position,
            ScheduleSettings,
            EmployeeConstraint
        } = this.db;

        try {
            // Загружаем все необходимые данные
            const [employees, shifts, positions, settings] = await Promise.all([
                Employee.findAll({
                    where: { role: 'employee', status: 'active' },
                    include: [{
                        model: Position,
                        as: 'defaultPosition'
                    }]
                }),
                Shift.findAll(),
                Position.findAll(),
                ScheduleSettings.findOne({ where: { site_id: siteId }})
            ]);

            // Загружаем ограничения
            const constraints = {};
            const constraintRecords = await EmployeeConstraint.findAll({
                where: { status: 'active' }
            });

            // Преобразуем ограничения в нужный формат
            constraintRecords.forEach(constraint => {
                if (!constraints[constraint.emp_id]) {
                    constraints[constraint.emp_id] = {};
                }
                // ... логика обработки ограничений ...
            });

            return {
                weekStart,
                employees,
                shifts,
                positions,
                settings: settings || { min_rest_base_hours: 8, max_shifts_per_day: 1 },
                constraints
            };
        } catch (error) {
            console.error('[ScheduleGeneratorService] Error preparing data:', error);
            throw error;
        }
    }

    async generateOptimalSchedule(data) {
        const {weekStart, employees, shifts, positions, settings, constraints} = data;
        const schedule = [];

        console.log(`[ScheduleGenerator] Starting optimal schedule generation...`);
        console.log(`[ScheduleGenerator] Settings:`, {
            min_rest_base_hours: settings.min_rest_base_hours,
            night_shift_rest_bonus: settings.night_shift_rest_bonus
        });

        // Create shifts lookup map with end times
        const shiftsMap = new Map();
        shifts.forEach(shift => {
            const shiftWithEndTime = this.calculateShiftEndTime(shift);
            shiftsMap.set(shift.shift_id, shiftWithEndTime);
        });

        // For each day of the week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = dayjs(weekStart).add(dayOffset, 'day');
            const dateStr = currentDate.format('YYYY-MM-DD');
            const dayName = currentDate.format('dddd');

            console.log(`[ScheduleGenerator] Processing ${dayName} ${dateStr}`);

            // For each shift in this day
            for (const shift of shifts) {
                const shiftWithTimes = shiftsMap.get(shift.shift_id);

                // For each position
                for (const position of positions) {
                    const requiredEmployees = position.num_of_emp;

                    // Find best employees for this shift
                    const assignedEmployeeIds = await this.assignOptimalEmployees(
                        dateStr,
                        shiftWithTimes,
                        position,
                        requiredEmployees,
                        employees,
                        constraints,
                        settings,
                        schedule,
                        shiftsMap
                    );

                    // Add assignments to schedule
                    assignedEmployeeIds.forEach(empId => {
                        if (empId) {
                            schedule.push({
                                date: dateStr,
                                emp_id: empId,
                                shift_id: shift.shift_id,
                                position_id: position.pos_id,
                                status: 'scheduled'
                            });

                            console.log(`[ScheduleGenerator] Added assignment: emp_id=${empId}, shift=${shift.shift_name}, position=${position.pos_name}, date=${dateStr}`);
                        }
                    });
                }
            }
        }

        console.log(`[ScheduleGenerator] Generated ${schedule.length} assignments`);
        return schedule;
    }

    /**
     * Calculate shift end time based on start time and duration
     */
     calculateShiftEndTime(shift) {
        const startTime = dayjs(`2000-01-01 ${shift.start_time}`);
        let endTime = startTime.add(shift.duration, 'hour');

        // Handle shifts that cross midnight
        if (endTime.date() !== startTime.date()) {
            shift.crosses_midnight = true;
        }

        return {
            ...shift,
            end_time: endTime.format('HH:mm:ss'),
            crosses_midnight: shift.crosses_midnight || false
        };
    }

     async assignOptimalEmployees(date, shift, position, requiredCount, employees, constraints, settings, existingSchedule, shiftsMap) {
        // Разделяем сотрудников на две группы
        const positionMatchedEmployees = employees.filter(emp =>
            emp.default_position_id === position.pos_id
        );

        const noPositionEmployees = employees.filter(emp =>
            emp.default_position_id === null || emp.default_position_id === undefined
        );

        console.log(`[ScheduleGenerator] Position ${position.pos_name}:`);
        console.log(`  - Matched employees: ${positionMatchedEmployees.length}`);
        console.log(`  - No position employees: ${noPositionEmployees.length}`);

        // Сначала проверяем доступность сотрудников с позицией
        const availableWithPosition = [];
        for (const emp of positionMatchedEmployees) {
            const isAvailable = await this.isEmployeeAvailable(
                emp.emp_id, date, shift, constraints, settings, existingSchedule, shiftsMap
            );
            if (isAvailable) {
                availableWithPosition.push(emp);
            }
        }

        // Затем проверяем сотрудников без позиции
        const availableNoPosition = [];
        for (const emp of noPositionEmployees) {
            const isAvailable = await this.isEmployeeAvailable(
                emp.emp_id, date, shift, constraints, settings, existingSchedule, shiftsMap
            );
            if (isAvailable) {
                availableNoPosition.push(emp);
            }
        }

        // Объединяем списки - сначала с позицией, потом без
        const availableEmployees = [...availableWithPosition, ...availableNoPosition];

        if (availableEmployees.length === 0) {
            console.warn(`[ScheduleGenerator] No available employees for ${position.pos_name} on ${date} ${shift.shift_name}`);
            return [];
        }

        // Сортируем по приоритету
        const sortedEmployees = availableEmployees
            .map(emp => ({
                emp_id: emp.emp_id,
                priority: this.calculateEmployeePriority(
                    emp.emp_id,
                    date,
                    shift,
                    constraints,
                    existingSchedule,
                    emp.default_position_id === position.pos_id // бонус за соответствие позиции
                )
            }))
            .sort((a, b) => b.priority - a.priority);

        const actualCount = Math.min(requiredCount, availableEmployees.length);
        return sortedEmployees.slice(0, actualCount).map(emp => emp.emp_id);
    }

     async isEmployeeAvailable(empId, date, shift, constraints, settings, existingSchedule, shiftsMap) {
        // 1. Check employee constraints
        const empConstraints = constraints[empId] || {};
        const dayConstraints = empConstraints[date] || {};

        if (dayConstraints[shift.shift_id] === 'cannot_work') {
            console.log(`[ScheduleGenerator] Employee ${empId} has cannot_work constraint for ${date} ${shift.shift_name}`);
            return false;
        }

        // 2. Check if already assigned to another shift this day
        const dayAssignments = existingSchedule.filter(assignment =>
            assignment.emp_id === empId && assignment.date === date
        );

        if (dayAssignments.length >= settings.max_shifts_per_day) {
            console.log(`[ScheduleGenerator] Employee ${empId} already has ${dayAssignments.length} shifts on ${date}`);
            return false;
        }

        // 3. Check rest period between shifts - CRITICAL CHECK
        const restCheck = await this.checkRestPeriod(empId, date, shift, settings, existingSchedule, shiftsMap);
        if (!restCheck.isValid) {
            console.log(`[ScheduleGenerator] Employee ${empId} fails rest period check for ${date} ${shift.shift_name}: ${restCheck.reason}`);
            return false;
        }

        return true;
    }

    /**
     * Calculate priority for employee assignment
     */
     calculateEmployeePriority(empId, date, shift, constraints, existingSchedule, hasMatchingPosition = false) {
        let priority = 100;

        // Большой бонус за соответствие позиции
        if (hasMatchingPosition) {
            priority += 100;
        }

        // Остальная логика приоритетов...
        const empConstraints = constraints[empId] || {};
        const dayConstraints = empConstraints[date] || {};

        if (dayConstraints[shift.shift_id] === 'prefer_work') {
            priority += 50;
        }

        const weekAssignments = existingSchedule.filter(assignment => assignment.emp_id === empId);
        priority -= weekAssignments.length * 5;

        const sameShiftCount = weekAssignments.filter(assignment => assignment.shift_id === shift.shift_id).length;
        priority -= sameShiftCount * 10;

        return priority;
    }

    /**
     * Check rest period requirements - FULLY IMPLEMENTED
     */
     async checkRestPeriod(empId, date, shift, settings, existingSchedule, shiftsMap) {
        const currentDate = dayjs(date);

        // Check previous day
        const previousDay = currentDate.subtract(1, 'day').format('YYYY-MM-DD');
        const previousAssignments = existingSchedule.filter(assignment =>
            assignment.emp_id === empId && assignment.date === previousDay
        );

        // Check next day
        const nextDay = currentDate.add(1, 'day').format('YYYY-MM-DD');
        const nextAssignments = existingSchedule.filter(assignment =>
            assignment.emp_id === empId && assignment.date === nextDay
        );

        // Check rest after previous shift
        if (previousAssignments.length > 0) {
            for (const prevAssignment of previousAssignments) {
                const prevShift = shiftsMap.get(prevAssignment.shift_id);
                if (!prevShift) continue;

                const restHours = this.calculateRestHours(
                    previousDay,
                    prevShift,
                    date,
                    shift
                );

                const requiredRest = this.getRequiredRestHours(prevShift, settings);

                if (restHours < requiredRest) {
                    return {
                        isValid: false,
                        reason: `Only ${restHours}h rest after ${prevShift.shift_name} (need ${requiredRest}h)`
                    };
                }
            }
        }

        // Check rest before next shift
        if (nextAssignments.length > 0) {
            for (const nextAssignment of nextAssignments) {
                const nextShift = shiftsMap.get(nextAssignment.shift_id);
                if (!nextShift) continue;

                const restHours = this.calculateRestHours(
                    date,
                    shift,
                    nextDay,
                    nextShift
                );

                const requiredRest = this.getRequiredRestHours(shift, settings);

                if (restHours < requiredRest) {
                    return {
                        isValid: false,
                        reason: `Only ${restHours}h rest before next ${nextShift.shift_name} (need ${requiredRest}h)`
                    };
                }
            }
        }

        return { isValid: true };
    }

    /**
     * Calculate actual rest hours between two shifts
     */
     calculateRestHours(date1, shift1, date2, shift2) {
        // Calculate end time of first shift
        const shift1Start = dayjs(`${date1} ${shift1.start_time}`);
        let shift1End = shift1Start.add(shift1.duration, 'hour');

        // Handle shifts crossing midnight
        if (shift1.crosses_midnight || shift1End.date() !== shift1Start.date()) {
            shift1End = shift1End.add(1, 'day');
        }

        // Calculate start time of second shift
        const shift2Start = dayjs(`${date2} ${shift2.start_time}`);

        // Calculate rest hours
        const restMs = shift2Start.diff(shift1End);
        const restHours = restMs / (1000 * 60 * 60);

        return Math.floor(restHours);
    }

    /**
     * Get required rest hours based on shift type and settings
     */
     getRequiredRestHours(previousShift, settings) {
        let requiredRest = settings.min_rest_base_hours || 11;

        // Add bonus for night shifts
        if (previousShift.is_night_shift) {
            requiredRest += settings.night_shift_rest_bonus || 3;
        }

        // Add bonus for long shifts
        if (previousShift.duration >= (settings.long_shift_threshold || 10)) {
            requiredRest += settings.long_shift_rest_bonus || 2;
        }

        // Israeli law minimum is 8 hours
        return Math.max(8, requiredRest);
    }

    /**
     * Save schedule to database
     */
    async saveSchedule(siteId, weekStart, assignments) {
        const { Schedule, ScheduleAssignment } = this.db;
        const { Op } = require('sequelize');

        try {
            const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

            console.log(`[ScheduleGenerator] Clearing existing assignments for week ${weekStart}...`);

            // Find and delete old schedules for this week
            const existingSchedules = await Schedule.findAll({
                where: {
                    site_id: siteId,
                    start_date: {
                        [Op.between]: [weekStart, weekEnd]
                    }
                }
            });

            // Delete related assignments
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
                    algorithm: 'optimal_assignment_v3_strict',
                    timezone: 'Asia/Jerusalem'
                })
            };

            // Create main Schedule record
            const schedule = await Schedule.create(scheduleData);

            // Prepare ScheduleAssignment data
            const scheduleAssignments = assignments.map((assignment, index) => ({
                schedule_id: schedule.id,
                emp_id: assignment.emp_id,
                shift_id: assignment.shift_id,
                position_id: assignment.position_id,
                work_date: new Date(assignment.date),
                status: 'scheduled',
                notes: `Generated automatically v3 strict - ${index + 1}`
            }));

            // Create ScheduleAssignment records
            if (scheduleAssignments.length > 0) {
                await ScheduleAssignment.bulkCreate(scheduleAssignments);
            }

            return {
                id: schedule.id,  // Добавляем для совместимости
                schedule_id: schedule.id,
                assignments_count: scheduleAssignments.length,
                success: true
            };

        } catch (error) {
            console.error('[ScheduleGenerator] Save error:', error);
            throw error;
        }
    }
}

module.exports = ScheduleGeneratorService;