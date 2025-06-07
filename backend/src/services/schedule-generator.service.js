// backend/src/services/schedule-generator.service.js (обновленная версия)
const {
    Employee,
    Shift,
    EmployeeConstraint,  // НОВАЯ МОДЕЛЬ
    ScheduleSettings,
    ScheduleAssignment,
    Schedule,
    Position
} = require('../models/associations');
const RestCalculatorService = require('./rest-calculator.service');
const {Op} = require('sequelize');
const dayjs = require('dayjs');

class ScheduleGeneratorService {

    /**
     * Генерировать расписание на неделю
     */
    static async generateWeeklySchedule(siteId, weekStart) {
        try {
            console.log(`[ScheduleGenerator] Starting generation for site ${siteId}, week ${weekStart}`);

            const data = await this.prepareScheduleData(siteId, weekStart);
            const schedule = await this.generateOptimalSchedule(data);
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

        // Get all active employees
        const employees = await Employee.findAll({
            where: {status: 'active'},
            attributes: ['emp_id', 'first_name', 'last_name']
        });

        // Get all shifts
        const shifts = await Shift.findAll({
            attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type', 'is_night_shift'],
            order: [['start_time', 'ASC']]
        });

        // Get positions for this site
        const positions = await Position.findAll({
            where: {site_id: siteId},
            attributes: ['pos_id', 'pos_name', 'num_of_emp', 'num_of_shifts']
        });

        // Get schedule settings
        const settings = await ScheduleSettings.findOne({
            where: {site_id: siteId}
        });

        // Get employee constraints for this week (UPDATED)
        const constraints = await EmployeeConstraint.findAll({
            where: {
                status: 'active',
                [Op.or]: [
                    // Permanent constraints
                    {
                        is_permanent: true,
                        applies_to: 'day_of_week'
                    },
                    // Temporary constraints for this week
                    {
                        is_permanent: false,
                        applies_to: 'specific_date',
                        target_date: {
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
     * Process constraints into convenient format (UPDATED)
     */
    static processConstraints(constraints, weekStart) {
        const processed = {};

        constraints.forEach(constraint => {
            const empId = constraint.emp_id;

            if (!processed[empId]) {
                processed[empId] = {};
            }

            if (constraint.applies_to === 'specific_date') {
                // Temporary constraint
                const date = constraint.target_date;
                if (!processed[empId][date]) {
                    processed[empId][date] = {};
                }
                processed[empId][date][constraint.shift_id] = constraint.constraint_type;

            } else if (constraint.applies_to === 'day_of_week') {
                // Permanent constraint - apply to all days of this type in the week
                for (let i = 0; i < 7; i++) {
                    const currentDate = dayjs(weekStart).add(i, 'day');
                    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.day()];

                    if (dayOfWeek === constraint.day_of_week) {
                        const dateStr = currentDate.format('YYYY-MM-DD');
                        if (!processed[empId][dateStr]) {
                            processed[empId][dateStr] = {};
                        }
                        processed[empId][dateStr][constraint.shift_id] = constraint.constraint_type;
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

        console.log(`[ScheduleGenerator] Starting optimal schedule generation...`);

        // For each day of the week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = dayjs(weekStart).add(dayOffset, 'day');
            const dateStr = currentDate.format('YYYY-MM-DD');
            const dayName = currentDate.format('dddd');

            console.log(`[ScheduleGenerator] Processing ${dayName} ${dateStr}`);

            // For each shift in this day
            for (const shift of shifts) {
                // For each position
                for (const position of positions) {
                    const requiredEmployees = position.num_of_emp;

                    // Find best employees for this shift
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

    static async assignOptimalEmployees(date, shift, position, requiredCount, employees, constraints, settings, existingSchedule) {
        // Get available employees
        const availableEmployees = [];

        for (const emp of employees) {
            const isAvailable = this.isEmployeeAvailable(emp.emp_id, date, shift, constraints, settings, existingSchedule);
            if (isAvailable) {
                availableEmployees.push(emp);
            }
        }

        if (availableEmployees.length === 0) {
            console.warn(`[ScheduleGenerator] No available employees for ${date} ${shift.shift_name}`);
            return [];
        }

        // Sort employees by priority
        const sortedEmployees = availableEmployees
            .map(emp => ({
                emp_id: emp.emp_id,
                priority: this.calculateEmployeePriority(emp.emp_id, date, shift, constraints, existingSchedule)
            }))
            .sort((a, b) => b.priority - a.priority);

        // Select best employees
        const actualCount = Math.min(requiredCount, availableEmployees.length);
        const selectedEmployees = sortedEmployees
            .slice(0, actualCount)
            .map(emp => emp.emp_id);

        return selectedEmployees;
    }

    static isEmployeeAvailable(empId, date, shift, constraints, settings, existingSchedule) {
        // 1. Check employee constraints
        const empConstraints = constraints[empId] || {};
        const dayConstraints = empConstraints[date] || {};

        // If employee has 'cannot_work' constraint for this shift
        if (dayConstraints[shift.shift_id] === 'cannot_work') {
            return false;
        }

        // 2. Check if already assigned to another shift this day
        const dayAssignments = existingSchedule.filter(assignment =>
            assignment.emp_id === empId && assignment.date === date
        );

        if (dayAssignments.length >= settings.max_shifts_per_day) {
            return false;
        }

        // 3. Check rest period between shifts
        if (!this.checkRestPeriod(empId, date, shift, settings, existingSchedule)) {
            return false;
        }

        return true;
    }

    /**
     * Рассчитать приоритет сотрудника для смены
     */
    static calculateEmployeePriority(empId, date, shift, constraints, existingSchedule) {
        let priority = 100;

        // 1. Bonus for preferring to work
        const empConstraints = constraints[empId] || {};
        const dayConstraints = empConstraints[date] || {};

        if (dayConstraints[shift.shift_id] === 'prefer_work') {
            priority += 50; // Big bonus
        }

        // 2. Penalty for number of already assigned shifts this week
        const weekAssignments = existingSchedule.filter(assignment => assignment.emp_id === empId);
        const weekPenalty = weekAssignments.length * 5;
        priority -= weekPenalty;

        // 3. Bonus for shift variety (avoid same shifts)
        const sameShiftCount = weekAssignments.filter(assignment => assignment.shift_id === shift.shift_id).length;
        const varietyPenalty = sameShiftCount * 10;
        priority -= varietyPenalty;

        return priority;
    }

    static checkRestPeriod(empId, date, shift, settings, existingSchedule) {
        // Find previous shift for this employee
        const previousDay = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
        const previousAssignment = existingSchedule.find(assignment =>
            assignment.emp_id === empId && assignment.date === previousDay
        );

        if (!previousAssignment) {
            return true; // No previous shift
        }

        // TODO: Implement detailed rest period check
        return true; // Simplified for now
    }


    /**
     * Сохранить расписание в базу данных
     */
    static async saveSchedule(siteId, weekStart, assignments) {
        const { Op } = require('sequelize');
        try {
            const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

            // **ДОБАВЛЯЕМ ОЧИСТКУ СТАРЫХ НАЗНАЧЕНИЙ**
            console.log(`[ScheduleGenerator] Clearing existing assignments for week ${weekStart}...`);

            // Находим и удаляем старые расписания для этой недели
            const existingSchedules = await Schedule.findAll({
                where: {
                    site_id: siteId,
                    start_date: {
                        [Op.between]: [weekStart, weekEnd]
                    }
                }
            });

            // Удаляем связанные назначения (каскадно удалятся через FK)
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
                    algorithm: 'optimal_assignment_v2',
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
                notes: `Generated automatically v2 - ${index + 1}`
            }));

            // Create ScheduleAssignment records
            await ScheduleAssignment.bulkCreate(scheduleAssignments);

            return {
                schedule_id: schedule.id,
                assignments_count: scheduleAssignments.length,
                week: `${weekStart} - ${weekEnd}`
            };

        } catch (error) {
            console.error(`[ScheduleGenerator] Save error:`, error);
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