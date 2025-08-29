// backend/src/controllers/schedule/schedule-employee.controller.js
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const {
    calculateWeekBounds,
    formatDisplayDate,
    ISRAEL_TIMEZONE,
    DATE_FORMAT,
} = require('./helpers/date-helpers');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    PositionShift,
    Position,
    WorkSite,
} = db;


const getWeeklySchedule = async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.query;

        console.log('[GetWeeklySchedule] User ID:', userId);

        // Get employee by user ID with work site details
        const employee = await Employee.findByPk(userId, {
            include: [
                {
                    model: Position,
                    as: 'defaultPosition',
                    attributes: ['pos_id', 'pos_name'],
                    include: [{
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name', 'address'],
                    }],
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name', 'address'],
                },
            ],
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found for this user',
            });
        }

        console.log('[GetWeeklySchedule] Employee found:', {
            emp_id: employee.emp_id,
            name: `${employee.first_name} ${employee.last_name}`,
            position: employee.defaultPosition?.pos_name,
        });

        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

        // Find published schedule for this week
        const schedules = await Schedule.findAll({
            where: {
                start_date: { [Op.lte]: weekEndStr },
                end_date: { [Op.gte]: weekStartStr },
                status: 'published',
            },
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_id', 'site_name', 'address'],
            }],
        });

        if (!schedules || schedules.length === 0) {
            return res.json({
                success: true,
                message: 'No published schedules found for this week',
                week: {
                    start: weekStartStr,
                    end: weekEndStr,
                },
                schedule: [],
                employee: {
                    emp_id: employee.emp_id,
                    name: `${employee.first_name} ${employee.last_name}`,
                    position_id: employee.default_position_id,
                    position_name: employee.defaultPosition?.pos_name,
                    site_id: employee.work_site_id,
                    site_name: employee.workSite?.site_name,
                },
            });
        }
        const scheduleIds = schedules.map(s => s.id);
        console.log('[GetWeeklySchedule] Found schedules:', scheduleIds);

        // Get all assignments for the week including worksite info
        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: { [Op.in]: scheduleIds },
                emp_id: employee.emp_id,  // Only get assignments for this employee
                work_date: {
                    [Op.between]: [weekStartStr, weekEndStr],
                },
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name'],
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'color'],
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name'],
                },
                {
                    model: Schedule,
                    as: 'schedule',
                    attributes: ['id', 'site_id'],
                    include: [{
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name', 'address'],
                    }],
                },
            ],
            order: [['work_date', 'ASC'], ['shift', 'start_time', 'ASC']],
        });

        console.log('[GetWeeklySchedule] Found assignments:', assignments.length);

        // Build weekly schedule data
        const weekSchedule = [];
        const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);
            const dayOfWeek = currentDay.day(); // 0 = Sunday, 6 = Saturday

            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr,
            );

            // Group assignments by shift
            const shiftsMap = new Map();

            dayAssignments.forEach(assignment => {
                const shiftKey = `${assignment.shift.id}-${assignment.schedule.site_id}`;
                if (!shiftsMap.has(shiftKey)) {
                    shiftsMap.set(shiftKey, {
                        shift_id: assignment.shift.id,
                        shift_name: assignment.shift.shift_name,
                        start_time: assignment.shift.start_time,
                        duration: assignment.shift.duration_hours,
                        color: assignment.shift.color,
                        employees: [],
                    });
                }

                // Add employee info with position and site from this specific assignment
                shiftsMap.get(shiftKey).employees.push({
                    emp_id: employee.emp_id,
                    name: `${employee.first_name} ${employee.last_name}`,
                    position: assignment.position.pos_name,
                    position_id: assignment.position.pos_id,
                    site_name: assignment.schedule.workSite?.site_name,
                    site_id: assignment.schedule.site_id,
                    is_current_user: true,
                    // Flags for display
                    is_cross_position: assignment.position.pos_id !== employee.default_position_id,
                    is_cross_site: assignment.schedule.site_id !== employee.work_site_id,
                    is_flexible: !employee.default_position_id || !employee.work_site_id,
                });
            });

            weekSchedule.push({
                date: dateStr,
                day_of_week: dayOfWeek,
                display_date: formatDisplayDate(dateStr),
                shifts: Array.from(shiftsMap.values()),
            });
        }

        res.json({
            success: true,
            message: 'Weekly schedule retrieved successfully',
            week: {
                start: weekStartStr,
                end: weekEndStr,
            },
            employee: {
                emp_id: employee.emp_id,
                name: `${employee.first_name} ${employee.last_name}`,
                position_id: employee.default_position_id,
                position_name: employee.defaultPosition?.pos_name,
                site_id: employee.work_site_id,
                site_name: employee.workSite?.site_name,
                site_address: employee.workSite?.address,
            },
            schedule: weekSchedule,
            metadata: {
                timezone: ISRAEL_TIMEZONE,
                generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString(),
            },
        });

    } catch (error) {
        console.error('[GetWeeklySchedule] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving weekly schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
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
            status: 'published',
        };

        if (site_id) {
            scheduleWhere.site_id = site_id;
        }

        const schedule = await Schedule.findOne({
            where: scheduleWhere,
            order: [['createdAt', 'DESC']],
        });

        if (!schedule) {
            return res.json({
                success: true,
                message: 'No published schedule found for this week',
                week: {
                    start: weekStartStr,
                    end: weekEndStr,
                },
                schedule: [],
            });
        }

        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: schedule.id,
                work_date: {
                    [Op.between]: [weekStartStr, weekEndStr],
                },
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name', 'status', 'default_position_id'],
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type'],
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession'],
                },
            ],
            order: [
                ['work_date', 'ASC'],
                ['position', 'pos_id', 'ASC'],
                ['shift', 'start_time', 'ASC'],
            ],
        });

        res.json({
            success: true,
            message: 'Admin weekly schedule retrieved successfully',
            week: {
                start: weekStartStr,
                end: weekEndStr,
            },
            schedule_id: schedule.id,
            site_id: schedule.site_id,
            assignments: assignments,
            metadata: {
                timezone: ISRAEL_TIMEZONE,
                generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString(),
            },
        });

    } catch (error) {
        console.error('[GetAdminWeeklySchedule] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving admin weekly schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

const getPositionWeeklySchedule = async (req, res) => {
    try {
        const { positionId } = req.params;
        const { date } = req.query;
        const userId = req.userId;

        console.log('[GetPositionWeeklySchedule] Position ID:', positionId, 'User ID:', userId);

        // Get employee
        const employee = await Employee.findByPk(userId, {
            include: [{
                model: Position,
                as: 'defaultPosition',
            }],
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

        // Find ALL published schedules for this week that might have this position
        const schedules = await Schedule.findAll({
            where: {
                start_date: { [Op.lte]: weekEndStr },
                end_date: { [Op.gte]: weekStartStr },
                status: 'published',
            },
            include: [{
                model: WorkSite,
                as: 'workSite',
            }],
        });

        if (!schedules || schedules.length === 0) {
            return res.json({
                success: true,
                message: 'No published schedules found for this week',
                week: {
                    start: weekStartStr,
                    end: weekEndStr,
                },
                days: [],
            });
        }

        const scheduleIds = schedules.map(s => s.id);

        // Get position with shifts
        const position = await Position.findByPk(positionId, {
            include: [{
                model: PositionShift,
                as: 'shifts',
                attributes: ['id', 'shift_name', 'start_time', 'duration_hours', 'color'],
            }],
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: 'Position not found',
            });
        }

        // Get ALL assignments for this position from ALL schedules
        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: { [Op.in]: scheduleIds },
                position_id: positionId,
                work_date: {
                    [Op.between]: [weekStartStr, weekEndStr],
                },
            },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name'],
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'duration_hours', 'color'],
                },
                {
                    model: Schedule,
                    as: 'schedule',
                    attributes: ['id', 'site_id'],
                    include: [{
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name'],
                    }],
                },
            ],
            order: [['work_date', 'ASC'], ['shift', 'start_time', 'ASC']],
        });

        // Build week days structure
        const weekDays = [];
        const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);

            const dayAssignments = assignments.filter(a => a.work_date === dateStr);

            // Group by shifts
            const dayShifts = [];
            position.shifts.forEach(shift => {
                const shiftAssignments = dayAssignments.filter(a => a.shift_id === shift.id);
                const employees = shiftAssignments.map(a => ({
                    emp_id: a.employee.emp_id,
                    name: `${a.employee.first_name} ${a.employee.last_name}`,
                    is_current_user: a.employee.emp_id === employee.emp_id,
                    site_name: a.schedule.workSite?.site_name,
                    site_id: a.schedule.site_id,
                    // Flags for display
                    is_cross_site: a.schedule.site_id !== position.site_id,
                }));

                dayShifts.push({
                    shift_id: shift.id,
                    employees,
                });
            });

            weekDays.push({
                date: dateStr,
                shifts: dayShifts,
            });
        }

        // Get all sites that have assignments for this position
        const sitesWithAssignments = [...new Set(assignments.map(a => a.schedule.site_id))];
        const siteNames = schedules
            .filter(s => sitesWithAssignments.includes(s.id))
            .map(s => s.workSite?.site_name)
            .filter(Boolean);

        res.json({
            success: true,
            week: {
                start: weekStartStr,
                end: weekEndStr,
            },
            position: {
                id: position.pos_id,
                name: position.pos_name,
                site_name: position.site?.site_name,
                // Additional info about cross-site assignments
                has_cross_site_assignments: sitesWithAssignments.length > 1,
                sites_involved: siteNames,
            },
            shifts: position.shifts.map(s => ({
                id: s.id,
                shift_name: s.shift_name,
                start_time: s.start_time,
                duration: s.duration_hours,
                color: s.color,
            })),
            days: weekDays,
        });

    } catch (error) {
        console.error('[GetPositionWeeklySchedule] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving position schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
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
                message: 'Employee not found',
            });
        }

        // Get first and last shift dates
        const firstAssignment = await ScheduleAssignment.findOne({
            where: { emp_id: employee.emp_id },
            order: [['work_date', 'ASC']],
            attributes: ['work_date'],
        });

        const lastAssignment = await ScheduleAssignment.findOne({
            where: { emp_id: employee.emp_id },
            order: [['work_date', 'DESC']],
            attributes: ['work_date'],
        });

        if (!firstAssignment || !lastAssignment) {
            return res.json({
                success: true,
                data: { availableMonths: [] },
            });
        }

        // Generate list of available months
        const availableMonths = [];
        const startDate = dayjs(firstAssignment.work_date);
        const endDate = dayjs(lastAssignment.work_date);
        let current = startDate.startOf('month');

        //  isSameOrBefore
        while (current.valueOf() <= endDate.startOf('month').valueOf()) {
            availableMonths.push(current.format('YYYY-MM'));
            current = current.add(1, 'month');
        }

        res.json({
            success: true,
            data: { availableMonths },
        });

    } catch (error) {
        console.error('[GetEmployeeArchiveSummary] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving archive summary',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
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
                message: 'Year and month are required',
            });
        }

        // Get employee
        const employee = await Employee.findByPk(userId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
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
                    [Op.between]: [monthStart, monthEnd],
                },
            },
            include: [
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'color'],
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name'],
                },
                {
                    model: Schedule,
                    as: 'schedule',
                    include: [{
                        model: WorkSite,
                        as: 'workSite',
                        attributes: ['site_id', 'site_name'],
                    }],
                },
            ],
            order: [['work_date', 'ASC']],
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
            site_name: assignment.schedule?.workSite?.site_name,
        }));

        res.json({
            success: true,
            data: {
                shifts,
                stats: {
                    totalShifts,
                    totalDays: uniqueDays,
                    totalHours: totalMinutes,
                },
            },
        });

    } catch (error) {
        console.error('[GetEmployeeArchiveMonth] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving archive data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    getWeeklySchedule,
    getAdminWeeklySchedule,
    getPositionWeeklySchedule,
    getEmployeeArchiveSummary,
    getEmployeeArchiveMonth,
};