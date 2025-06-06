// backend/src/services/schedule-generator.service.js
const {
    Employee,
    Shift,
    ConstraintType,
    ScheduleSettings,
    ScheduleAssignment,
    Position
} = require('../models/associations');
const RestCalculatorService = require('./rest-calculator.service');
const {Op} = require('sequelize');
const dayjs = require('dayjs');

class ScheduleGeneratorService {

    /**
     * Генерировать расписание на неделю
     * @param {number} siteId - ID рабочего объекта
     * @param {string} weekStart - Дата начала недели (YYYY-MM-DD)
     * @returns {Object} Результат генерации
     */
    static async generateWeeklySchedule(siteId, weekStart) {
        try {
            console.log(`[ScheduleGenerator] Starting generation for site ${siteId}, week ${weekStart}`);

            // 1. Подготовка данных
            const data = await this.prepareScheduleData(siteId, weekStart);

            // 2. Генерация расписания
            const schedule = await this.generateOptimalSchedule(data);

            // 3. Сохранение результата
            const savedSchedule = await this.saveSchedule(siteId, weekStart, schedule);

            return {
                success: true,
                schedule: savedSchedule,
                stats: this.calculateScheduleStats(schedule)
            };

        } catch (error) {
            console.error('[ScheduleGenerator] Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Подготовить все необходимые данные для планирования
     */
    static async prepareScheduleData(siteId, weekStart) {
        const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

        console.log(`[ScheduleGenerator] Preparing data for week ${weekStart} - ${weekEnd}`);

        // Получить всех активных сотрудников
        const employees = await Employee.findAll({
            where: {status: 'active'},
            attributes: ['emp_id', 'first_name', 'last_name']
        });

        // Получить все смены
        const shifts = await Shift.findAll({
            attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type', 'is_night_shift'],
            order: [['start_time', 'ASC']]
        });

        // Получить позиции для этого объекта
        const positions = await Position.findAll({
            where: {site_id: siteId},
            attributes: ['pos_id', 'pos_name', 'num_of_emp', 'num_of_shifts']
        });

        // Получить настройки планирования
        const settings = await ScheduleSettings.findOne({
            where: {site_id: siteId}
        });

        // Получить ограничения сотрудников на эту неделю
        const constraints = await ConstraintType.findAll({
            where: {
                status: 'approved',
                [Op.or]: [
                    // Постоянные ограничения
                    {
                        is_permanent: true,
                        applies_to: 'day_of_week'
                    },
                    // Временные ограничения на эту неделю
                    {
                        is_permanent: false,
                        applies_to: 'specific_date',
                        start_date: {
                            [Op.between]: [weekStart, weekEnd]
                        }
                    }
                ]
            },
            include: [{
                model: Employee,
                as: 'employee',
                attributes: ['emp_id']
            }]
        });

        console.log(`[ScheduleGenerator] Found ${employees.length} employees, ${shifts.length} shifts, ${constraints.length} constraints`);

        return {
            weekStart,
            weekEnd,
            employees,
            shifts,
            positions,
            settings: settings || this.getDefaultSettings(),
            constraints: this.processConstraints(constraints, weekStart)
        };
    }

    /**
     * Обработать ограничения в удобный формат
     */
    static processConstraints(constraints, weekStart) {
        const processed = {};

        constraints.forEach(constraint => {
            const empId = constraint.emp_id;

            if (!processed[empId]) {
                processed[empId] = {};
            }

            if (constraint.applies_to === 'specific_date') {
                // Временное ограничение
                const date = constraint.start_date;
                if (!processed[empId][date]) {
                    processed[empId][date] = {};
                }
                processed[empId][date][constraint.shift_id] = constraint.type;

            } else if (constraint.applies_to === 'day_of_week') {
                // Постоянное ограничение - применить ко всем дням недели этого типа
                for (let i = 0; i < 7; i++) {
                    const currentDate = dayjs(weekStart).add(i, 'day');
                    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.day()];

                    if (dayOfWeek === constraint.day_of_week) {
                        const dateStr = currentDate.format('YYYY-MM-DD');
                        if (!processed[empId][dateStr]) {
                            processed[empId][dateStr] = {};
                        }
                        processed[empId][dateStr][constraint.shift_id] = constraint.type;
                    }
                }
            }
        });

        console.log(`[ScheduleGenerator] Processed constraints for ${Object.keys(processed).length} employees`);
        return processed;
    }

    /**
     * Основной алгоритм генерации расписания
     */
    static async generateOptimalSchedule(data) {
        const {weekStart, employees, shifts, positions, settings, constraints} = data;
        const schedule = [];

        console.log(`[ScheduleGenerator] ==================== GENERATION START ====================`);
        console.log(`[ScheduleGenerator] employees.length: ${employees.length}`);
        console.log(`[ScheduleGenerator] shifts.length: ${shifts.length}`);
        console.log(`[ScheduleGenerator] positions.length: ${positions.length}`);

        // Для каждого дня недели
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = dayjs(weekStart).add(dayOffset, 'day');
            const dateStr = currentDate.format('YYYY-MM-DD');
            const dayName = currentDate.format('dddd');

            if (employees.length === 0) {
                throw new Error('No employees available for scheduling');
            }

            if (shifts.length === 0) {
                throw new Error('No shifts configured');
            }

            if (positions.length === 0) {
                throw new Error('No positions configured');
            }

            console.log(`[ScheduleGenerator] Processing ${dayName} ${dateStr}`);

            // Для каждой смены в этот день
            for (const shift of shifts) {
                // Для каждой позиции
                for (const position of positions) {
                    const requiredEmployees = position.num_of_emp;

                    // Найти лучших сотрудников для этой смены
                    const assignedEmployeeIds = await this.assignOptimalEmployees(
                        dateStr,
                        shift,
                        position,
                        requiredEmployees,
                        employees,
                        constraints,
                        settings,
                        schedule
                    );

                    // Добавить назначения в расписание
                    assignedEmployeeIds.forEach(empId => {
                        if (empId) { // Проверить что empId не undefined
                            schedule.push({
                                date: dateStr,
                                emp_id: empId, // ← ИСПРАВЛЕНО: теперь берем из assignedEmployeeIds
                                shift_id: shift.shift_id,
                                position_id: position.pos_id,
                                status: 'scheduled'
                            });

                            console.log(`[ScheduleGenerator] Added assignment: emp_id=${empId}, shift=${shift.shift_name}, position=${position.pos_name}, date=${dateStr}`);
                        } else {
                            console.warn(`[ScheduleGenerator] ⚠️ No employee assigned for ${dateStr} ${shift.shift_name} position ${position.pos_name}`);
                        }
                    });
                }
            }
        }

        console.log(`[ScheduleGenerator] Generated ${schedule.length} assignments`);
        return schedule;
    }

    /**
     * Найти оптимальных сотрудников для конкретной смены
     */
    static async assignOptimalEmployees(date, shift, position, requiredCount, employees, constraints, settings, existingSchedule) {

        console.log(`[ScheduleGenerator] 🔍 assignOptimalEmployees called:`);
        console.log(`  - date: ${date}`);
        console.log(`  - shift: ${shift.shift_name} (ID: ${shift.shift_id})`);
        console.log(`  - position: ${position.pos_name} (ID: ${position.pos_id})`);
        console.log(`  - requiredCount: ${requiredCount}`);
        console.log(`  - total employees: ${employees.length}`);

        // Получить список доступных сотрудников
        const availableEmployees = [];

        for (const emp of employees) {
            const isAvailable = this.isEmployeeAvailable(emp.emp_id, date, shift, constraints, settings, existingSchedule);
            console.log(`  - Employee ${emp.emp_id} (${emp.first_name}): available = ${isAvailable}`);

            if (isAvailable) {
                availableEmployees.push(emp);
            }
        }

        console.log(`[ScheduleGenerator] Available employees: ${availableEmployees.length}/${employees.length}`);

        // Если нет доступных сотрудников
        if (availableEmployees.length === 0) {
            console.warn(`[ScheduleGenerator] No available employees for ${date} ${shift.shift_name}`);
            return [];
        }

        // Если недостаточно доступных сотрудников
        if (availableEmployees.length < requiredCount) {
            console.warn(`[ScheduleGenerator] Not enough available employees for ${date} ${shift.shift_name}. Need: ${requiredCount}, Available: ${availableEmployees.length}`);
            // Возвращаем тех, кто есть, а не пустой массив
        }

        // Отсортировать сотрудников по приоритету
        const sortedEmployees = availableEmployees
            .map(emp => {
                const priority = this.calculateEmployeePriority(emp.emp_id, date, shift, constraints, existingSchedule);
                console.log(`  - Employee ${emp.emp_id} (${emp.first_name}) priority: ${priority}`);
                return {
                    emp_id: emp.emp_id,           // ← ИСПРАВЛЕНИЕ: явно сохраняем emp_id
                    first_name: emp.first_name,   // ← ИСПРАВЛЕНИЕ: сохраняем имя для отладки
                    last_name: emp.last_name,     // ← ИСПРАВЛЕНИЕ: сохраняем фамилию для отладки
                    priority: priority
                };
            })
            .sort((a, b) => b.priority - a.priority);

        console.log(`[ScheduleGenerator] Sorted employees by priority:`, sortedEmployees.map(e => `${e.emp_id}:${e.priority}`));

        // Выбрать лучших сотрудников
        const actualCount = Math.min(requiredCount, availableEmployees.length);
        const selectedEmployees = sortedEmployees
            .slice(0, actualCount)
            .map(emp => emp.emp_id);

        console.log(`[ScheduleGenerator] 🎯 Selected ${selectedEmployees.length}/${requiredCount} employees: [${selectedEmployees.join(', ')}]`);

        return selectedEmployees;
    }

    /**
     * Проверить доступность сотрудника для смены
     */
    static isEmployeeAvailable(empId, date, shift, constraints, settings, existingSchedule) {

        console.log(`    🔍 Checking availability for employee ${empId} on ${date} ${shift.shift_name}:`);

        // 1. Проверить ограничения сотрудника
        const empConstraints = constraints[empId] || {};
        const dayConstraints = empConstraints[date] || {};

        console.log(`      - Employee constraints for ${date}:`, dayConstraints);

        // Если есть ограничение "cannot_work" на эту смену
        if (dayConstraints[shift.shift_id] === 'cannot_work') {
            console.log(`      ❌ Employee has 'cannot_work' constraint for shift ${shift.shift_id}`);
            return false;
        }

        // 2. Проверить не назначен ли уже на другую смену в этот день
        const dayAssignments = existingSchedule.filter(assignment =>
            assignment.emp_id === empId && assignment.date === date
        );

        console.log(`      - Existing assignments for ${date}: ${dayAssignments.length}`);

        if (dayAssignments.length >= settings.max_shifts_per_day) {
            return false;
        }

        // 3. Проверить отдых между сменами
        if (!this.checkRestPeriod(empId, date, shift, settings, existingSchedule)) {
            console.log(`      ❌ Employee already has ${dayAssignments.length} shifts (max: ${settings.max_shifts_per_day})`);
            return false;
        }

        // 4. Проверить максимальные рабочие дни подряд
        if (!this.checkConsecutiveWorkDays(empId, date, settings, existingSchedule)) {
            return false;
        }
        console.log(`      ✅ Employee is available`);
        return true;
    }

    /**
     * Рассчитать приоритет сотрудника для смены
     */
    static calculateEmployeePriority(empId, date, shift, constraints, existingSchedule) {
        let priority = 100; // Базовый приоритет

        // 1. Бонус за предпочтение работать
        const empConstraints = constraints[empId] || {};
        const dayConstraints = empConstraints[date] || {};

        if (dayConstraints[shift.shift_id] === 'prefer_work') {
            priority += 50; // Большой бонус
            console.log(`      - Prefer work bonus: +50 (total: ${priority})`);
        }

        // 2. Штраф за количество уже назначенных смен на этой неделе
        const weekAssignments = existingSchedule.filter(assignment => assignment.emp_id === empId);
        const weekPenalty = weekAssignments.length * 5;
        priority -= weekPenalty;
        console.log(`      - Week assignments penalty: -${weekPenalty} (${weekAssignments.length} shifts, total: ${priority})`);

        // 3. Бонус за разнообразие смен (избегать одних и тех же смен)
        const sameShiftCount = weekAssignments.filter(assignment => assignment.shift_id === shift.shift_id).length;
        const varietyPenalty = sameShiftCount * 10;
        priority -= varietyPenalty;
        console.log(`      - Same shift penalty: -${varietyPenalty} (${sameShiftCount} same shifts, total: ${priority})`);

        console.log(`    📊 Final priority for employee ${empId}: ${priority}`);
        return priority;
    }

    /**
     * Проверить период отдыха между сменами
     */
    static checkRestPeriod(empId, date, shift, settings, existingSchedule) {
        // Найти предыдущую смену сотрудника
        const previousDay = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
        const previousAssignment = existingSchedule.find(assignment =>
            assignment.emp_id === empId && assignment.date === previousDay
        );

        if (!previousAssignment) {
            return true; // Нет предыдущей смены
        }

        // Использовать RestCalculatorService для проверки
        // TODO: Реализовать более детальную проверку с точным временем
        return true; // Пока упрощенно
    }

    /**
     * Проверить максимальные рабочие дни подряд
     */
    static checkConsecutiveWorkDays(empId, date, settings, existingSchedule) {
        // TODO: Реализовать проверку consecutive work days
        return true; // Пока упрощенно
    }

    /**
     * Сохранить расписание в базу данных
     */
    static async saveSchedule(siteId, weekStart, assignments) {
        const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

        try {
            console.log(`[ScheduleGenerator] ==================== SAVE SCHEDULE START ====================`);
            console.log(`[ScheduleGenerator] siteId: ${siteId}, weekStart: ${weekStart}, weekEnd: ${weekEnd}`);
            console.log(`[ScheduleGenerator] assignments.length: ${assignments.length}`);

            if (assignments.length > 0) {
                console.log(`[ScheduleGenerator] First assignment:`, assignments[0]);
            }

            // Проверим доступность модели Schedule
            const { Schedule } = require('../models/associations');
            console.log(`[ScheduleGenerator] Schedule model loaded successfully`);

            // Данные для создания Schedule
            const scheduleData = {
                start_date: new Date(weekStart),
                end_date: new Date(weekEnd),
                site_id: siteId,
                status: 'draft',
                text_file: JSON.stringify({
                    generated_at: new Date().toISOString(),
                    algorithm: 'optimal_assignment',
                    timezone: 'Asia/Jerusalem'
                })
            };

            console.log(`[ScheduleGenerator] Creating Schedule with data:`, scheduleData);

            // STEP 1: Создать основную запись Schedule
            const schedule = await Schedule.create(scheduleData);
            console.log(`[ScheduleGenerator] ✅ Schedule created successfully with ID: ${schedule.id}`);

            // STEP 2: Подготовить ScheduleAssignment данные
            console.log(`[ScheduleGenerator] Preparing ${assignments.length} ScheduleAssignment records...`);

            const scheduleAssignments = assignments.map((assignment, index) => {
                const assignmentData = {
                    schedule_id: schedule.id,
                    emp_id: assignment.emp_id,
                    shift_id: assignment.shift_id,
                    position_id: assignment.position_id,
                    work_date: new Date(assignment.date),
                    status: 'scheduled',
                    notes: `Generated automatically - ${index + 1}`
                };

                // Проверить каждое поле
                Object.keys(assignmentData).forEach(key => {
                    if (assignmentData[key] === undefined || assignmentData[key] === null) {
                        console.error(`[ScheduleGenerator] ❌ Assignment ${index} has null/undefined field '${key}':`, assignmentData);
                        throw new Error(`Assignment ${index} missing field: ${key}`);
                    }
                });

                if (index < 3) { // Показать первые 3 для отладки
                    console.log(`[ScheduleGenerator] Assignment ${index}:`, assignmentData);
                }

                return assignmentData;
            });

            console.log(`[ScheduleGenerator] All ${scheduleAssignments.length} assignments prepared successfully`);

            // STEP 3: Создать ScheduleAssignment записи
            console.log(`[ScheduleGenerator] Creating ScheduleAssignment records...`);
            await ScheduleAssignment.bulkCreate(scheduleAssignments);
            console.log(`[ScheduleGenerator] ✅ ScheduleAssignment records created successfully`);

            console.log(`[ScheduleGenerator] ==================== SAVE SCHEDULE SUCCESS ====================`);

            return {
                schedule_id: schedule.id,
                assignments_count: scheduleAssignments.length,
                week: `${weekStart} - ${weekEnd}`
            };

        } catch (error) {
            console.error(`[ScheduleGenerator] ❌ ==================== SAVE SCHEDULE ERROR ====================`);
            console.error(`[ScheduleGenerator] Error message: ${error.message}`);
            console.error(`[ScheduleGenerator] Error stack:`, error.stack);
            console.error(`[ScheduleGenerator] SQL State:`, error.parent?.sqlState);
            console.error(`[ScheduleGenerator] SQL Message:`, error.parent?.sqlMessage);
            console.error(`[ScheduleGenerator] Full error:`, error);
            throw error;
        }
    }

    /**
     * Рассчитать статистику расписания
     */
    static calculateScheduleStats(assignments) {
        const employeeStats = {};

        assignments.forEach(assignment => {
            if (!employeeStats[assignment.emp_id]) {
                employeeStats[assignment.emp_id] = {
                    total_shifts: 0,
                    shift_types: {}
                };
            }

            employeeStats[assignment.emp_id].total_shifts++;

            const shiftType = assignment.shift_id;
            if (!employeeStats[assignment.emp_id].shift_types[shiftType]) {
                employeeStats[assignment.emp_id].shift_types[shiftType] = 0;
            }
            employeeStats[assignment.emp_id].shift_types[shiftType]++;
        });

        return {
            total_assignments: assignments.length,
            employees_assigned: Object.keys(employeeStats).length,
            employee_stats: employeeStats
        };
    }

    /**
     * Настройки по умолчанию
     */
    static getDefaultSettings() {
        return {
            max_shifts_per_day: 1,
            max_consecutive_work_days: 6,
            min_rest_base_hours: 11,
            night_shift_rest_bonus: 3,
            long_shift_threshold: 10,
            long_shift_rest_bonus: 2
        };
    }
}

module.exports = ScheduleGeneratorService;