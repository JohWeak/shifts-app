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

        // Для каждого дня недели
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = days[dayIndex];
            const dayOfWeek = dayjs(date).day(); // 0 = Sunday, 6 = Saturday

            console.log(`[ScheduleGenerator] Processing ${date} (day ${dayOfWeek})`);

            // Для каждой позиции
            for (const position of positions) {
                // Для каждой смены этой позиции
                for (const positionShift of position.shifts) {
                    const shift = shiftsMap.get(positionShift.shift_id);
                    if (!shift) continue;

                    // Получаем требования для этой позиции, смены и дня недели
                    const requirements = shiftRequirementsMap.get(`${position.pos_id}-${shift.shift_id}`);

                    // Находим требование для текущего дня недели
                    let requiredCount = position.num_of_emp; // По умолчанию из позиции
                    let isWorkingDay = true;

                    if (requirements && requirements.length > 0) {
                        // Ищем требование для конкретного дня недели
                        const dayRequirement = requirements.find(req =>
                            req.is_recurring &&
                            (req.day_of_week === dayOfWeek || req.day_of_week === null)
                        );

                        // Ищем требование для конкретной даты
                        const dateRequirement = requirements.find(req =>
                            !req.is_recurring &&
                            req.specific_date === date
                        );

                        // Приоритет: конкретная дата > день недели > значение по умолчанию
                        if (dateRequirement) {
                            requiredCount = dateRequirement.required_staff_count;
                            isWorkingDay = dateRequirement.is_working_day;
                        } else if (dayRequirement) {
                            requiredCount = dayRequirement.required_staff_count;
                            isWorkingDay = dayRequirement.is_working_day;
                        }
                    }

                    // Пропускаем нерабочие дни/смены
                    if (!isWorkingDay || requiredCount === 0) {
                        console.log(`[ScheduleGenerator] Skipping ${position.pos_name} - ${shift.shift_name} on ${date} (non-working)`);
                        continue;
                    }

                    console.log(`[ScheduleGenerator] Need ${requiredCount} employees for ${position.pos_name} - ${shift.shift_name} on ${date}`);

                    // Находим подходящих сотрудников
                    const assignedEmployees = await this.assignOptimalEmployees(
                        date,
                        shift,
                        position,
                        requiredCount,
                        employees,
                        constraints,
                        settings,
                        existingSchedule,
                        shiftsMap
                    );

                    // Добавляем назначения в расписание
                    assignedEmployees.forEach(empId => {
                        const assignment = {
                            date: date,
                            emp_id: empId,
                            shift_id: shift.shift_id,
                            position_id: position.pos_id,
                            status: 'scheduled'
                        };

                        schedule.push(assignment);
                        existingSchedule.push(assignment);

                        console.log(`[ScheduleGenerator] Assigned employee ${empId} to ${position.pos_name} - ${shift.shift_name} on ${date}`);
                    });

                    // Если не хватает сотрудников
                    if (assignedEmployees.length < requiredCount) {
                        console.warn(`[ScheduleGenerator] Shortage: only ${assignedEmployees.length}/${requiredCount} employees assigned`);
                    }
                }
            }
        }

        console.log(`[ScheduleGenerator] Generated ${schedule.length} assignments`);
        return schedule;
    }

    /**
     * 2. Создаем метод для подготовки данных (как в CPSATBridge)
     */

    async prepareData(siteId, weekStart) {
        const {
            Employee,
            Position,
            PositionShift,
            ShiftRequirement,
            ScheduleSettings,
            EmployeeConstraint,
            WorkSite
        } = this.db;

        try {
            console.log(`[ScheduleGeneratorService] Preparing data for site ${siteId}, week ${weekStart}`);

            // Загружаем позиции с их сменами и требованиями
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
                }]
            });

            console.log(`[ScheduleGeneratorService] Found ${positions.length} active positions`);

            // Проверяем, есть ли позиции со сменами
            const positionsWithShifts = positions.filter(p => p.shifts && p.shifts.length > 0);
            if (positionsWithShifts.length === 0) {
                throw new Error('No positions with configured shifts found for this site');
            }

            // Собираем все уникальные смены и создаем карту смен
            const shiftsMap = new Map();
            const shiftRequirementsMap = new Map();

            positions.forEach(position => {
                position.shifts?.forEach(shift => {
                    if (!shiftsMap.has(shift.id)) {
                        shiftsMap.set(shift.id, {
                            shift_id: shift.id,
                            shift_name: shift.shift_name,
                            start_time: shift.start_time,
                            end_time: shift.end_time,
                            duration: shift.duration_hours || this.calculateDuration(shift.start_time, shift.end_time),
                            is_night_shift: shift.is_night_shift,
                            color: shift.color
                        });
                    }

                    // Сохраняем требования для каждой позиции и смены
                    const key = `${position.pos_id}-${shift.id}`;
                    shiftRequirementsMap.set(key, shift.requirements || []);
                });
            });

            const shifts = Array.from(shiftsMap.values());
            console.log(`[ScheduleGeneratorService] Found ${shifts.length} unique shifts across all positions`);

            // Загружаем сотрудников с их позициями
            const employees = await Employee.findAll({
                where: {
                    role: 'employee',
                    status: 'active'
                },
                include: [{
                    model: Position,
                    as: 'defaultPosition'
                }]
            });

            console.log(`[ScheduleGeneratorService] Found ${employees.length} active employees`);

            // Загружаем настройки расписания
            const settings = await ScheduleSettings.findOne({
                where: { site_id: siteId }
            });

            // Загружаем ограничения сотрудников для недели
            const weekEnd = dayjs(weekStart).add(6, 'days').format('YYYY-MM-DD');
            const constraintRecords = await EmployeeConstraint.findAll({
                where: {
                    status: 'active',
                    [this.db.Sequelize.Op.or]: [
                        // Постоянные ограничения по дням недели
                        {
                            applies_to: 'day_of_week',
                            is_permanent: true
                        },
                        // Ограничения на конкретные даты в пределах недели
                        {
                            applies_to: 'specific_date',
                            target_date: {
                                [this.db.Sequelize.Op.between]: [weekStart, weekEnd]
                            }
                        }
                    ]
                }
            });

            // Преобразуем ограничения в удобный формат
            const constraints = {};
            const days = this.generateWeekDays(weekStart);

            constraintRecords.forEach(constraint => {
                if (!constraints[constraint.emp_id]) {
                    constraints[constraint.emp_id] = {};
                }

                if (constraint.applies_to === 'specific_date') {
                    // Ограничение на конкретную дату
                    const dateStr = dayjs(constraint.target_date).format('YYYY-MM-DD');
                    if (!constraints[constraint.emp_id][dateStr]) {
                        constraints[constraint.emp_id][dateStr] = {};
                    }

                    // Если указана смена в старом формате, нужно найти соответствующие новые смены
                    if (constraint.shift_id) {
                        // Находим все новые смены, которые соответствуют времени старой смены
                        shifts.forEach(shift => {
                            constraints[constraint.emp_id][dateStr][shift.shift_id] = constraint.constraint_type;
                        });
                    } else {
                        // Ограничение на весь день
                        shifts.forEach(shift => {
                            constraints[constraint.emp_id][dateStr][shift.shift_id] = constraint.constraint_type;
                        });
                    }
                } else if (constraint.applies_to === 'day_of_week') {
                    // Ограничение по дню недели
                    days.forEach(day => {
                        const dayOfWeek = dayjs(day).day();
                        const constraintDayMap = {
                            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                            'thursday': 4, 'friday': 5, 'saturday': 6
                        };

                        if (constraintDayMap[constraint.day_of_week] === dayOfWeek) {
                            if (!constraints[constraint.emp_id][day]) {
                                constraints[constraint.emp_id][day] = {};
                            }

                            shifts.forEach(shift => {
                                constraints[constraint.emp_id][day][shift.shift_id] = constraint.constraint_type;
                            });
                        }
                    });
                }
            });

            // Формируем структуру позиций с требованиями по персоналу
            const positionsData = positions.map(position => {
                const positionShifts = position.shifts || [];

                return {
                    pos_id: position.pos_id,
                    pos_name: position.pos_name,
                    site_id: position.site_id,
                    num_of_emp: position.num_of_emp || 1, // Значение по умолчанию из позиции
                    shifts: positionShifts.map(shift => ({
                        shift_id: shift.id,
                        requirements: shift.requirements || []
                    }))
                };
            });

            return {
                weekStart,
                employees,
                shifts,
                positions: positionsData,
                shiftsMap,
                shiftRequirementsMap,
                settings: settings || {
                    min_rest_base_hours: 11,
                    max_shifts_per_day: 1,
                    max_consecutive_work_days: 6,
                    max_cannot_work_days: 2
                },
                constraints,
                days
            };
        } catch (error) {
            console.error('[ScheduleGeneratorService] Error preparing data:', error);
            throw error;
        }
    }

// Вспомогательная функция для расчета длительности смены
    calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let duration;
        if (endHour >= startHour) {
            duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        } else {
            // Ночная смена
            duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
        }

        return duration / 60; // Возвращаем в часах
    }

// Генерация дней недели
    generateWeekDays(weekStart) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(dayjs(weekStart).add(i, 'days').format('YYYY-MM-DD'));
        }
        return days;
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

        const weekEnd = dayjs(weekStart).add(6, 'days').format('YYYY-MM-DD');

        try {
            // Создаем запись расписания
            const schedule = await Schedule.create({
                site_id: siteId,
                start_date: weekStart,
                end_date: weekEnd,
                status: 'draft',
                text_file: JSON.stringify({
                    generated_at: new Date(),
                    algorithm: 'simple',
                    timezone: 'Asia/Jerusalem'
                })
            });

            // Сохраняем назначения
            if (assignments.length > 0) {
                const scheduleAssignments = assignments.map(assignment => ({
                    schedule_id: schedule.id,
                    emp_id: assignment.emp_id,
                    shift_id: assignment.shift_id,
                    position_id: assignment.position_id,
                    work_date: assignment.date,
                    status: assignment.status || 'scheduled',
                    notes: `Generated by Simple algorithm`
                }));

                await ScheduleAssignment.bulkCreate(scheduleAssignments);
            }

            console.log(`[ScheduleGenerator] Saved schedule ${schedule.id} with ${assignments.length} assignments`);

            return {
                schedule_id: schedule.id,
                assignments_count: assignments.length
            };

        } catch (error) {
            console.error('[ScheduleGenerator] Error saving schedule:', error);
            throw error;
        }
    }
}

module.exports = ScheduleGeneratorService;