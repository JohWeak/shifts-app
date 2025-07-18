// backend/src/controllers/schedule/schedule-employee.controller.js
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const {
    calculateWeekBounds,
    formatDisplayDate,
    ISRAEL_TIMEZONE,
    DATE_FORMAT
} = require('./helpers/date-helpers');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    PositionShift,
    Position,
    WorkSite
} = db;

const getWeeklySchedule = async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.query;

        console.log('[GetWeeklySchedule] User ID:', userId);

        // Get employee by user ID
        // Ищем сотрудника по emp_id = userId
        const employee = await Employee.findByPk(userId, {
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name']
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name']
                }
            ]
        });


        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found for this user'
            });
        }

        console.log('[GetWeeklySchedule] Employee found:', {
            emp_id: employee.emp_id,
            name: `${employee.first_name} ${employee.last_name}`,
            position: employee.defaultPosition?.pos_name
        });

        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

        // Find published schedule for this week
        const schedule = await Schedule.findOne({
            where: {
                start_date: { [Op.lte]: weekEndStr },
                end_date: { [Op.gte]: weekStartStr },
                status: 'published'
            },
            order: [['createdAt', 'DESC']]
        });

        if (!schedule) {
            return res.json({
                success: true,
                message: 'No published schedule found for this week',
                week: {
                    start: weekStartStr,
                    end: weekEndStr
                },
                schedule: [],
                employee: {
                    emp_id: employee.emp_id,
                    name: `${employee.first_name} ${employee.last_name}`,
                    position_id: employee.default_position_id,
                    position_name: employee.defaultPosition?.pos_name,
                    site_id: employee.work_site_id,
                    site_name: employee.workSite?.site_name
                }
            });
        }

        // Get all assignments for the week including worksite info
        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: schedule.id,
                work_date: {
                    [Op.between]: [weekStartStr, weekEndStr]
                }
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'color']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name']
                }
            ],
            order: [['work_date', 'ASC'], ['shift', 'start_time', 'ASC']]
        });

        // Add WorkSite info from schedule
        const scheduleWithSite = await Schedule.findByPk(schedule.id, {
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name']
            }]
        });

        // Build weekly schedule data
        const weekSchedule = [];
        const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);
            const dayOfWeek = currentDay.day(); // 0 = Sunday, 6 = Saturday

            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr
            );

            // Group assignments by shift
            const shiftsMap = new Map();

            dayAssignments.forEach(assignment => {
                const shiftId = assignment.shift.id;
                if (!shiftsMap.has(shiftId)) {
                    shiftsMap.set(shiftId, {
                        shift_id: shiftId,
                        shift_name: assignment.shift.shift_name,
                        start_time: assignment.shift.start_time,
                        duration: assignment.shift.duration_hours,
                        color: assignment.shift.color,
                        employees: []
                    });
                }

                shiftsMap.get(shiftId).employees.push({
                    emp_id: assignment.employee.emp_id,
                    name: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                    position: assignment.position.pos_name,
                    site_name: scheduleWithSite.workSite?.site_name,
                    is_current_user: assignment.employee.emp_id === employee.emp_id
                });
            });

            weekSchedule.push({
                date: dateStr,
                day_of_week: dayOfWeek,
                display_date: formatDisplayDate(dateStr),
                shifts: Array.from(shiftsMap.values())
            });
        }

        res.json({
            success: true,
            message: 'Weekly schedule retrieved successfully',
            week: {
                start: weekStartStr,
                end: weekEndStr
            },
            employee: {
                emp_id: employee.emp_id,
                name: `${employee.first_name} ${employee.last_name}`,
                position_id: employee.default_position_id,
                position_name: employee.defaultPosition?.pos_name,
                site_id: employee.work_site_id,
                site_name: employee.workSite?.site_name
            },
            schedule: weekSchedule,
            metadata: {
                timezone: ISRAEL_TIMEZONE,
                generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString()
            }
        });

    } catch (error) {
        console.error('[GetWeeklySchedule] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving weekly schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getAdminWeeklySchedule = async (req, res) => {
    try {
        const { date, site_id } = req.query;

        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

        const scheduleWhere = {
            start_date: { [Op.lte]: weekEndStr },
            end_date: { [Op.gte]: weekStartStr },
            status: 'published'
        };

        if (site_id) {
            scheduleWhere.site_id = site_id;
        }

        const schedule = await Schedule.findOne({
            where: scheduleWhere,
            order: [['createdAt', 'DESC']]
        });

        if (!schedule) {
            return res.json({
                success: true,
                message: 'No published schedule found for this week',
                week: {
                    start: weekStartStr,
                    end: weekEndStr
                },
                schedule: []
            });
        }

        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: schedule.id,
                work_date: {
                    [Op.between]: [weekStartStr, weekEndStr]
                }
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name', 'status', 'default_position_id']
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession']
                }
            ],
            order: [
                ['work_date', 'ASC'],
                ['position', 'pos_id', 'ASC'],
                ['shift', 'start_time', 'ASC']
            ]
        });

        res.json({
            success: true,
            message: 'Admin weekly schedule retrieved successfully',
            week: {
                start: weekStartStr,
                end: weekEndStr
            },
            schedule_id: schedule.id,
            site_id: schedule.site_id,
            assignments: assignments,
            metadata: {
                timezone: ISRAEL_TIMEZONE,
                generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString()
            }
        });

    } catch (error) {
        console.error('[GetAdminWeeklySchedule] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving admin weekly schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getPositionWeeklySchedule = async (req, res) => {
    try {
        const { positionId } = req.params;
        const { date } = req.query;
        const userId = req.userId;

        console.log('[GetPositionWeeklySchedule] Position ID:', positionId, 'User ID:', userId);

        // Проверяем, что у сотрудника есть доступ к этой позиции
        const employee = await Employee.findByPk(userId, {
            include: [{
                model: Position,
                as: 'defaultPosition'
            }]
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Проверяем, что сотрудник привязан к этой позиции
        if (employee.default_position_id !== parseInt(positionId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this position schedule'
            });
        }

        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

        // Находим опубликованное расписание
        const schedule = await Schedule.findOne({
            where: {
                start_date: { [Op.lte]: weekEndStr },
                end_date: { [Op.gte]: weekStartStr },
                status: 'published'
            },
            include: [{
                model: WorkSite,
                as: 'workSite'
            }],
            order: [['createdAt', 'DESC']]
        });

        if (!schedule) {
            return res.json({
                success: true,
                message: 'No published schedule found for this week',
                week: {
                    start: weekStartStr,
                    end: weekEndStr
                },
                days: []
            });
        }

        // Получаем информацию о позиции со сменами
        const position = await Position.findByPk(positionId, {
            include: [{
                model: PositionShift,
                as: 'shifts',
                where: { is_active: true },
                required: false,
                order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
            }]
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        // Получаем все назначения для этой позиции
        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: schedule.id,
                position_id: positionId,
                work_date: {
                    [Op.between]: [weekStartStr, weekEndStr]
                }
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'color']
                }
            ],
            order: [['work_date', 'ASC'], ['shift', 'start_time', 'ASC']]
        });

        // Строим структуру данных для недели
        const weekDays = [];
        const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);

            const dayAssignments = assignments.filter(a => a.work_date === dateStr);

            // Группируем по сменам
            const dayShifts = [];
            position.shifts.forEach(shift => {
                const shiftAssignments = dayAssignments.filter(a => a.shift_id === shift.id);
                const employees = shiftAssignments.map(a => ({
                    emp_id: a.employee.emp_id,
                    name: `${a.employee.first_name} ${a.employee.last_name}`,
                    is_current_user: a.employee.emp_id === employee.emp_id
                }));

                dayShifts.push({
                    shift_id: shift.id,
                    employees
                });
            });

            weekDays.push({
                date: dateStr,
                shifts: dayShifts
            });
        }

        res.json({
            success: true,
            week: {
                start: weekStartStr,
                end: weekEndStr
            },
            position: {
                id: position.pos_id,
                name: position.pos_name,
                site_name: schedule.workSite?.site_name
            },
            shifts: position.shifts.map(s => ({
                id: s.id,
                shift_name: s.shift_name,
                start_time: s.start_time,
                duration: s.duration_hours,
                color: s.color
            })),
            days: weekDays
        });

    } catch (error) {
        console.error('[GetPositionWeeklySchedule] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving position schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getEmployeeArchiveSummary = async (req, res) => {
    try {
        const userId = req.userId;

        // Get employee
        const employee = await Employee.findByPk(userId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get first and last shift dates - используем правильное имя колонки emp_id
        const firstAssignment = await ScheduleAssignment.findOne({
            where: { emp_id: employee.emp_id }, // Исправлено с employee_id на emp_id
            order: [['work_date', 'ASC']],
            attributes: ['work_date']
        });

        const lastAssignment = await ScheduleAssignment.findOne({
            where: { emp_id: employee.emp_id }, // Исправлено с employee_id на emp_id
            order: [['work_date', 'DESC']],
            attributes: ['work_date']
        });

        if (!firstAssignment || !lastAssignment) {
            return res.json({
                success: true,
                data: { availableMonths: [] }
            });
        }

        // Generate list of available months
        const availableMonths = [];
        const startDate = dayjs(firstAssignment.work_date);
        const endDate = dayjs(lastAssignment.work_date);
        let current = startDate.startOf('month');

        while (current.isSameOrBefore(endDate, 'month')) {
            availableMonths.push(current.format('YYYY-MM'));
            current = current.add(1, 'month');
        }

        res.json({
            success: true,
            data: { availableMonths }
        });

    } catch (error) {
        console.error('[GetEmployeeArchiveSummary] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving archive summary',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getEmployeeArchiveMonth = async (req, res) => {
    try {
        const userId = req.userId;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: 'Year and month are required'
            });
        }

        // Get employee
        const employee = await Employee.findByPk(userId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Calculate month boundaries
        const monthStart = dayjs()
            .year(parseInt(year))
            .month(parseInt(month) - 1)
            .startOf('month')
            .format(DATE_FORMAT);

        const monthEnd = dayjs()
            .year(parseInt(year))
            .month(parseInt(month) - 1)
            .endOf('month')
            .format(DATE_FORMAT);

        // Get all assignments for the month - используем правильное имя колонки emp_id
        const assignments = await ScheduleAssignment.findAll({
            where: {
                emp_id: employee.emp_id, // Исправлено с employee_id на emp_id
                work_date: {
                    [Op.between]: [monthStart, monthEnd]
                }
            },
            include: [
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'color']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name']
                },
                {
                    model: Schedule,
                    as: 'schedule',
                    include: [{
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name']
                    }]
                }
            ],
            order: [['work_date', 'ASC']]
        });

        // Calculate statistics
        const totalShifts = assignments.length;
        const uniqueDays = new Set(assignments.map(a => a.work_date)).size;
        const totalMinutes = assignments.reduce((sum, a) => {
            return sum + (a.shift.duration_hours * 60);
        }, 0);

        // Format shifts data
        const shifts = assignments.map(assignment => ({
            shift_id: assignment.shift.id,
            shift_name: assignment.shift.shift_name,
            work_date: assignment.work_date,
            start_time: assignment.shift.start_time,
            end_time: assignment.shift.end_time,
            duration_hours: assignment.shift.duration_hours,
            color: assignment.shift.color,
            position_name: assignment.position?.pos_name,
            site_name: assignment.schedule?.workSite?.site_name
        }));

        res.json({
            success: true,
            data: {
                shifts,
                stats: {
                    totalShifts,
                    totalDays: uniqueDays,
                    totalHours: totalMinutes
                }
            }
        });

    } catch (error) {
        console.error('[GetEmployeeArchiveMonth] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving archive data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getWeeklySchedule,
    getAdminWeeklySchedule,
    getPositionWeeklySchedule,
    getEmployeeArchiveSummary,
    getEmployeeArchiveMonth
};