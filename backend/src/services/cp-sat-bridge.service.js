// backend/src/services/cp-sat-bridge.service.js
/**
 * Заглушка для CP-SAT Bridge
 * Этот файл нужен для совместимости, но CP-SAT функциональность отключена
 */

class CPSATBridge {
    async prepareScheduleData(siteId, weekStart) {
        // Подготовка данных (копия из advanced-scheduler)
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

    async saveSchedule(siteId, weekStart, assignments) {
        const { Schedule, ScheduleAssignment } = require('../models/associations');
        const { Op } = require('sequelize');  // ✅ ДОБАВИТЬ ЭТУ СТРОКУ
        const dayjs = require('dayjs');

        const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

        // ✅ ДОБАВИТЬ КОД ОЧИСТКИ
        console.log(`[CP-SAT Bridge] Clearing existing assignments for week ${weekStart}...`);

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
                algorithm: 'Advanced-Heuristic',
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
            notes: `Generated by Advanced optimizer - ${index + 1}`
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
            algorithm: 'Advanced-Heuristic'
        };
    }

    // Заглушка для CP-SAT (не работает без Python)
    static async generateOptimalSchedule(siteId, weekStart) {
        return {
            success: false,
            error: 'CP-SAT requires Python and OR-Tools installation',
            algorithm: 'CP-SAT-Disabled'
        };
    }
}

module.exports = CPSATBridge;