// backend/src/services/advanced-scheduler.service.js (исправленная версия)
/**
 * Продвинутый планировщик без OR-Tools
 * Использует эвристические алгоритмы и constraint programming принципы
 */

class AdvancedScheduler {
    /**
     * Генерация оптимального расписания с продвинутыми эвристиками
     */
    static async generateOptimalSchedule(siteId, weekStart) {
        try {
            console.log(`[Advanced Scheduler] Starting optimization for site ${siteId}, week ${weekStart}`);

            const scheduler = new AdvancedScheduler();

            // 1. Подготовка данных
            const data = await scheduler.prepareScheduleData(siteId, weekStart);

            // 2. Многоэтапная оптимизация
            const solution = await scheduler.multiStageOptimization(data);

            // 3. Сохранение результатов
            const savedSchedule = await scheduler.saveSchedule(siteId, weekStart, solution.schedule);

            return {
                success: true,
                schedule: savedSchedule,
                stats: scheduler.calculateScheduleStats(solution.schedule),
                algorithm: 'Advanced-Heuristic',
                iterations: solution.iterations,
                score: solution.score
            };

        } catch (error) {
            console.error('[Advanced Scheduler] Error:', error);
            return {
                success: false,
                error: error.message,
                algorithm: 'Advanced-Heuristic'
            };
        }
    }

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

        // Получить данные из БД
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
        }) || { max_shifts_per_day: 1 };

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

        // Создать структуру дней
        const days = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = dayjs(weekStart).add(i, 'day');
            days.push({
                index: i,
                date: currentDate.format('YYYY-MM-DD'),
                dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.day()]
            });
        }

        // Обработать ограничения
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

    async multiStageOptimization(data) {
        console.log('[Advanced Scheduler] Starting multi-stage optimization...');

        // Этап 1: Удовлетворение жестких ограничений
        let solution = this.satisfyHardConstraints(data);

        // Этап 2: Оптимизация предпочтений
        solution = this.optimizePreferences(solution, data);

        // Этап 3: Балансировка нагрузки
        solution = this.balanceWorkload(solution, data);

        // Этап 4: Локальные улучшения
        solution = this.localImprovement(solution, data);

        return solution;
    }

    satisfyHardConstraints(data) {
        console.log('[Advanced Scheduler] Satisfying hard constraints...');

        const { employees, shifts, positions, days, constraints } = data;
        const schedule = [];

        // Создать матрицу доступности
        const availability = this.createAvailabilityMatrix(employees, days, shifts, constraints);

        // Жадное назначение с проверкой ограничений
        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
            for (const shift of shifts) {
                for (const position of positions) {
                    const requiredEmployees = position.num_of_emp;
                    const assignedEmployees = this.assignEmployeesGreedy(
                        dayIndex, shift, position, requiredEmployees,
                        employees, availability, schedule, data
                    );

                    assignedEmployees.forEach(empId => {
                        schedule.push({
                            emp_id: empId,
                            date: days[dayIndex].date,
                            shift_id: shift.shift_id,
                            position_id: position.pos_id
                        });
                    });
                }
            }
        }

        return {
            schedule,
            score: this.calculateScore(schedule, data),
            iterations: 1
        };
    }

    createAvailabilityMatrix(employees, days, shifts, constraints) {
        const availability = new Map();

        // Инициализация - все доступны
        employees.forEach(emp => {
            availability.set(emp.emp_id, new Map());
            days.forEach((day, dayIndex) => {
                availability.get(emp.emp_id).set(dayIndex, new Map());
                shifts.forEach(shift => {
                    availability.get(emp.emp_id).get(dayIndex).set(shift.shift_id, true);
                });
            });
        });

        // Применить ограничения "cannot_work"
        constraints.cannot_work.forEach(constraint => {
            const empId = constraint.emp_id;
            const dayIndex = constraint.day_index;
            const shiftId = constraint.shift_id;

            if (availability.has(empId) &&
                availability.get(empId).has(dayIndex) &&
                availability.get(empId).get(dayIndex).has(shiftId)) {
                availability.get(empId).get(dayIndex).set(shiftId, false);
            }
        });

        return availability;
    }

    assignEmployeesGreedy(dayIndex, shift, position, requiredCount, employees, availability, existingSchedule, data) {
        const assigned = [];
        const candidates = [];

        // Собрать кандидатов
        employees.forEach(emp => {
            if (this.isEmployeeAvailable(emp.emp_id, dayIndex, shift, availability, existingSchedule, data)) {
                const priority = this.calculateEmployeePriority(emp.emp_id, dayIndex, shift, existingSchedule, data);
                candidates.push({
                    emp_id: emp.emp_id,
                    priority
                });
            }
        });

        // Отсортировать по приоритету
        candidates.sort((a, b) => b.priority - a.priority);

        // Назначить лучших
        const actualCount = Math.min(requiredCount, candidates.length);
        for (let i = 0; i < actualCount; i++) {
            assigned.push(candidates[i].emp_id);
        }

        return assigned;
    }

    isEmployeeAvailable(empId, dayIndex, shift, availability, existingSchedule, data) {
        // Проверить матрицу доступности
        if (!availability.get(empId).get(dayIndex).get(shift.shift_id)) {
            return false;
        }

        // Проверить не назначен ли уже в этот день
        const dayAssignments = existingSchedule.filter(assignment =>
            assignment.emp_id === empId &&
            assignment.date === data.days[dayIndex].date
        );

        return dayAssignments.length < (data.settings.max_shifts_per_day || 1);
    }

    calculateEmployeePriority(empId, dayIndex, shift, existingSchedule, data) {
        let priority = 100;

        // Бонус за предпочтения
        const preferenceBonus = this.getPreferenceBonus(empId, dayIndex, shift, data);
        priority += preferenceBonus;

        // Штраф за количество уже назначенных смен
        const weekAssignments = existingSchedule.filter(assignment => assignment.emp_id === empId);
        priority -= weekAssignments.length * 5;

        // Бонус за разнообразие смен
        const varietyBonus = this.getVarietyBonus(empId, shift, existingSchedule);
        priority += varietyBonus;

        return priority;
    }

    getPreferenceBonus(empId, dayIndex, shift, data) {
        const preference = data.constraints.prefer_work.find(c =>
            c.emp_id === empId &&
            c.day_index === dayIndex &&
            c.shift_id === shift.shift_id
        );
        return preference ? 50 : 0;
    }

    getVarietyBonus(empId, shift, existingSchedule) {
        const sameShiftCount = existingSchedule.filter(assignment =>
            assignment.emp_id === empId &&
            assignment.shift_id === shift.shift_id
        ).length;

        return Math.max(0, 10 - sameShiftCount * 3);
    }

    optimizePreferences(solution, data) {
        console.log('[Advanced Scheduler] Optimizing preferences...');

        // Улучшение решения через локальный поиск
        let improved = true;
        let iterations = 0;

        while (improved && iterations < 100) {
            improved = false;
            iterations++;

            // Попробовать улучшения через swap операции
            for (let i = 0; i < solution.schedule.length; i++) {
                for (let j = i + 1; j < solution.schedule.length; j++) {
                    const assignment1 = solution.schedule[i];
                    const assignment2 = solution.schedule[j];

                    // Попробовать обменять сотрудников
                    if (this.canSwapAssignments(assignment1, assignment2, data)) {
                        const newSchedule = [...solution.schedule];
                        newSchedule[i] = { ...assignment1, emp_id: assignment2.emp_id };
                        newSchedule[j] = { ...assignment2, emp_id: assignment1.emp_id };

                        const newScore = this.calculateScore(newSchedule, data);
                        if (newScore > solution.score) {
                            solution.schedule = newSchedule;
                            solution.score = newScore;
                            improved = true;
                        }
                    }
                }
            }
        }

        solution.iterations += iterations;
        return solution;
    }

    canSwapAssignments(assignment1, assignment2, data) {
        // Упрощенная проверка возможности обмена
        return assignment1.date !== assignment2.date ||
            assignment1.shift_id !== assignment2.shift_id;
    }

    balanceWorkload(solution, data) {
        console.log('[Advanced Scheduler] Balancing workload...');

        // Подсчитать нагрузку каждого сотрудника
        const workload = new Map();
        data.employees.forEach(emp => {
            workload.set(emp.emp_id, 0);
        });

        solution.schedule.forEach(assignment => {
            workload.set(assignment.emp_id, workload.get(assignment.emp_id) + 1);
        });

        // Найти дисбаланс и попытаться исправить
        const avgWorkload = solution.schedule.length / data.employees.length;
        const overloaded = [];
        const underloaded = [];

        workload.forEach((load, empId) => {
            if (load > avgWorkload + 1) {
                overloaded.push({ emp_id: empId, excess: load - Math.ceil(avgWorkload) });
            } else if (load < avgWorkload - 1) {
                underloaded.push({ emp_id: empId, deficit: Math.floor(avgWorkload) - load });
            }
        });

        // Попытаться перераспределить
        // (Упрощенная реализация)

        return solution;
    }

    localImprovement(solution, data) {
        console.log('[Advanced Scheduler] Applying local improvements...');

        // Дополнительные локальные улучшения
        // можно добавить позже

        return solution;
    }

    calculateScore(schedule, data) {
        let score = 0;

        // Базовый счет за покрытие
        score += schedule.length * 10;

        // Бонус за удовлетворение предпочтений "prefer_work"
        data.constraints.prefer_work.forEach(preference => {
            const dayIndex = preference.day_index;
            const date = data.days[dayIndex].date;

            const hasPreferredAssignment = schedule.some(assignment =>
                assignment.emp_id === preference.emp_id &&
                assignment.date === date &&
                assignment.shift_id === preference.shift_id
            );

            if (hasPreferredAssignment) {
                score += 50; // Высокий бонус за удовлетворение предпочтений
            }
        });

        // Штраф за дисбаланс нагрузки
        const workloadBalance = this.calculateWorkloadBalance(schedule, data.employees);
        score -= workloadBalance.penalty;

        // Бонус за разнообразие смен
        const varietyBonus = this.calculateVarietyBonus(schedule, data);
        score += varietyBonus;

        return score;
    }

    calculateWorkloadBalance(schedule, employees) {
        const workload = new Map();
        employees.forEach(emp => workload.set(emp.emp_id, 0));

        schedule.forEach(assignment => {
            workload.set(assignment.emp_id, workload.get(assignment.emp_id) + 1);
        });

        const loads = Array.from(workload.values());
        const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
        const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;

        return {
            variance,
            penalty: Math.floor(variance * 10) // Штраф за неравномерность
        };
    }

    calculateVarietyBonus(schedule, data) {
        let bonus = 0;
        const employeeShiftTypes = new Map();

        // Подсчитать типы смен для каждого сотрудника
        schedule.forEach(assignment => {
            if (!employeeShiftTypes.has(assignment.emp_id)) {
                employeeShiftTypes.set(assignment.emp_id, new Set());
            }

            const shift = data.shifts.find(s => s.shift_id === assignment.shift_id);
            if (shift) {
                employeeShiftTypes.get(assignment.emp_id).add(shift.shift_type);
            }
        });

        // Бонус за разнообразие
        employeeShiftTypes.forEach(shiftTypes => {
            bonus += shiftTypes.size * 5; // Бонус за каждый уникальный тип смены
        });

        return bonus;
    }

    async saveSchedule(siteId, weekStart, assignments) {
        // Используем тот же метод сохранения что и в CP-SAT Bridge
        const CPSATBridge = require('./cp-sat-bridge.service');
        const bridge = new CPSATBridge();
        return await bridge.saveSchedule(siteId, weekStart, assignments);
    }

    calculateScheduleStats(assignments) {
        // Используем тот же метод расчета статистики
        const CPSATBridge = require('./cp-sat-bridge.service');
        const bridge = new CPSATBridge();
        return bridge.calculateScheduleStats(assignments);
    }
}

module.exports = AdvancedScheduler;