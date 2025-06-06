// backend/src/controllers/schedule.controller.js - Production version
const { Schedule, ScheduleAssignment, Employee, Shift, Position, WorkSite } = require('../models/associations');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const ScheduleGeneratorService = require('../services/schedule-generator.service');

// Configure Day.js plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);

// Set locale to start week on Sunday
dayjs.locale({
    ...dayjs.Ls.en,
    weekStart: 0 // 0 = Sunday, 1 = Monday
});

// Configuration constants
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';
const DATE_FORMAT = 'YYYY-MM-DD';
const WEEK_START_DAY = 0; // Sunday

/**
 * Calculate week boundaries in Israel timezone
 * @param {string|Date} inputDate - Target date
 * @returns {Object} - { weekStart, weekEnd, weekStartStr, weekEndStr }
 */
function calculateWeekBounds(inputDate = null) {
    try {
        // Parse input date in Israel timezone
        let targetDate;
        if (inputDate) {
            targetDate = dayjs(inputDate).tz(ISRAEL_TIMEZONE);
        } else {
            targetDate = dayjs().tz(ISRAEL_TIMEZONE);
        }

        // Use native JavaScript Date for accurate day calculation
        const jsDate = new Date(targetDate.format('YYYY-MM-DD'));
        const dayOfWeek = jsDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

        // Calculate days to subtract to get to Sunday
        const daysToSubtract = dayOfWeek;

        // Calculate week start (Sunday)
        const weekStartJs = new Date(jsDate);
        weekStartJs.setDate(jsDate.getDate() - daysToSubtract);

        // Calculate week end (Saturday)
        const weekEndJs = new Date(weekStartJs);
        weekEndJs.setDate(weekStartJs.getDate() + 6);

        // Convert back to dayjs for formatting
        const weekStart = dayjs(weekStartJs).tz(ISRAEL_TIMEZONE);
        const weekEnd = dayjs(weekEndJs).tz(ISRAEL_TIMEZONE);

        // Convert to UTC for database storage
        const weekStartUtc = weekStart.utc();
        const weekEndUtc = weekEnd.utc();

        // Format as strings for database queries
        const weekStartStr = weekStartUtc.format(DATE_FORMAT);
        const weekEndStr = weekEndUtc.format(DATE_FORMAT);

        // Debug logging with verification
        console.log(`[Week Calculation] Input: ${inputDate || 'now'}`);
        console.log(`[Week Calculation] Israel time: ${targetDate.format('YYYY-MM-DD dddd')}`);
        console.log(`[Week Calculation] JS Date: ${jsDate.toDateString()}`);
        console.log(`[Week Calculation] JS Day of week: ${dayOfWeek} (0=Sun, 1=Mon, ...)`);
        console.log(`[Week Calculation] Days to subtract: ${daysToSubtract}`);
        console.log(`[Week Calculation] Week start JS: ${weekStartJs.toDateString()}`);
        console.log(`[Week Calculation] Week end JS: ${weekEndJs.toDateString()}`);
        console.log(`[Week Calculation] Week: ${weekStartStr} (${weekStart.format('dddd')}) to ${weekEndStr} (${weekEnd.format('dddd')})`);

        // Validate that we got Sunday to Saturday
        if (weekStartJs.getDay() !== 0) {
            console.error(`[Week Calculation] ERROR: Week start is day ${weekStartJs.getDay()}, should be 0 (Sunday)!`);
        }
        if (weekEndJs.getDay() !== 6) {
            console.error(`[Week Calculation] ERROR: Week end is day ${weekEndJs.getDay()}, should be 6 (Saturday)!`);
        }

        return {
            weekStart: weekStartUtc.toDate(),
            weekEnd: weekEndUtc.toDate(),
            weekStartStr,
            weekEndStr,
            israelWeekStart: weekStart,
            israelWeekEnd: weekEnd
        };
    } catch (error) {
        console.error('[Week Calculation] Error:', error);
        throw new Error('Invalid date format');
    }
}

/**
 * Get day name in Hebrew
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Hebrew day name
 */
function getHebrewDayName(dateStr) {
    const date = dayjs(dateStr).tz(ISRAEL_TIMEZONE);
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return dayNames[date.day()];
}

/**
 * Format date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date (DD/MM)
 */
function formatDisplayDate(dateStr) {
    return dayjs(dateStr).tz(ISRAEL_TIMEZONE).format('DD/MM');
}

// Get weekly schedule for employee's position
exports.getWeeklySchedule = async (req, res) => {
    try {
        const empId = req.userId;
        const { date } = req.query;

        // Validate employee exists
        const employee = await Employee.findByPk(empId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Calculate week boundaries using Israel timezone
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
                schedule: []
            });
        }

        // Get assignments for the week
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
                    attributes: ['emp_id', 'first_name', 'last_name', 'status']
                },
                {
                    model: Shift,
                    as: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession']
                }
            ],
            order: [['work_date', 'ASC'], ['shift', 'start_time', 'ASC']]
        });

        // Build weekly schedule data
        const weekSchedule = [];
        const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);

            // Get assignments for this day
            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr
            );

            // Group assignments by shift
            const shiftsMap = new Map();
            dayAssignments.forEach(assignment => {
                const shiftId = assignment.shift.shift_id;
                if (!shiftsMap.has(shiftId)) {
                    shiftsMap.set(shiftId, {
                        shift_id: shiftId,
                        shift_name: assignment.shift.shift_name,
                        start_time: assignment.shift.start_time,
                        duration: assignment.shift.duration,
                        shift_type: assignment.shift.shift_type,
                        employees: []
                    });
                }

                shiftsMap.get(shiftId).employees.push({
                    emp_id: assignment.employee.emp_id,
                    name: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                    position: assignment.position.pos_name,
                    is_current_user: assignment.employee.emp_id === empId
                });
            });

            weekSchedule.push({
                date: dateStr,
                day_name: getHebrewDayName(dateStr),
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
            current_employee: {
                emp_id: empId,
                name: `${employee.first_name} ${employee.last_name}`
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

// Get schedule for admin view (all positions, all employees)
exports.getAdminWeeklySchedule = async (req, res) => {
    try {
        const { date, site_id } = req.query;

        // Calculate week boundaries
        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

        // Build where condition for site
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

        // Get all assignments with full details
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
                    attributes: ['emp_id', 'first_name', 'last_name', 'status']
                },
                {
                    model: Shift,
                    as: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession'],
                    include: [
                        {
                            model: WorkSite,
                            as: 'workSite',
                            attributes: ['site_id', 'site_name']
                        }
                    ]
                }
            ],
            order: [['work_date', 'ASC'], ['position', 'pos_name', 'ASC'], ['shift', 'start_time', 'ASC']]
        });

        // Build admin schedule (similar logic as above but grouped by position)
        const adminSchedule = [];
        const weekStart = dayjs(weekStartStr).tz(ISRAEL_TIMEZONE);

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);

            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr
            );

            // Group by position, then by shift
            const positionsMap = new Map();
            dayAssignments.forEach(assignment => {
                const posId = assignment.position.pos_id;
                if (!positionsMap.has(posId)) {
                    positionsMap.set(posId, {
                        position_id: posId,
                        position_name: assignment.position.pos_name,
                        profession: assignment.position.profession,
                        work_site: assignment.position.workSite,
                        shifts: new Map()
                    });
                }

                const position = positionsMap.get(posId);
                const shiftId = assignment.shift.shift_id;

                if (!position.shifts.has(shiftId)) {
                    position.shifts.set(shiftId, {
                        shift_id: shiftId,
                        shift_name: assignment.shift.shift_name,
                        start_time: assignment.shift.start_time,
                        duration: assignment.shift.duration,
                        shift_type: assignment.shift.shift_type,
                        employees: []
                    });
                }

                position.shifts.get(shiftId).employees.push({
                    emp_id: assignment.employee.emp_id,
                    name: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                    status: assignment.status || 'scheduled'
                });
            });

            // Convert maps to arrays
            const positions = Array.from(positionsMap.values()).map(pos => ({
                ...pos,
                shifts: Array.from(pos.shifts.values())
            }));

            adminSchedule.push({
                date: dateStr,
                day_name: getHebrewDayName(dateStr),
                display_date: formatDisplayDate(dateStr),
                positions: positions
            });
        }

        res.json({
            success: true,
            message: 'Admin weekly schedule retrieved successfully',
            week: {
                start: weekStartStr,
                end: weekEndStr
            },
            schedule: adminSchedule,
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

exports.generateNextWeekSchedule = async (req, res) => {
    try {
        const siteId = req.body.site_id || 1; // TODO: получать из пользователя

        // Рассчитать следующую неделю
        const nextWeekStart = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD');

        console.log(`[ScheduleController] Generating schedule for site ${siteId}, week starting ${nextWeekStart}`);

        const result = await ScheduleGeneratorService.generateWeeklySchedule(siteId, nextWeekStart);

        if (result.success) {
            res.json({
                success: true,
                message: 'Schedule generated successfully',
                data: result.schedule,
                stats: result.stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to generate schedule',
                error: result.error
            });
        }

    } catch (error) {
        console.error('[ScheduleController] Error generating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.getAllSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, site_id } = req.query;

        const whereClause = {};
        if (site_id) {
            whereClause.site_id = site_id;
        }

        const schedules = await Schedule.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: (page - 1) * limit,
            order: [['start_date', 'DESC']],
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_name']
            }]
        });

        res.json({
            success: true,
            data: schedules.rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(schedules.count / limit),
                total_items: schedules.count,
                per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving schedules',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Получить детали конкретного расписания
exports.getScheduleDetails = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        // Получить основную информацию о расписании
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [{
                model: WorkSite,
                as: 'workSite',
                attributes: ['site_name']
            }]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        // Получить все назначения для этого расписания
        const assignments = await ScheduleAssignment.findAll({
            where: { schedule_id: scheduleId },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    model: Shift,
                    as: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                },
                {
                    model: Position,
                    as: 'position',
                    attributes: ['pos_id', 'pos_name', 'profession']
                }
            ],
            order: [['work_date', 'ASC'], ['shift_id', 'ASC']]
        });

        // Группировать назначения по дням
        const assignmentsByDate = {};
        assignments.forEach(assignment => {
            console.log('Processing assignment:', assignment);
            console.log('Type of work_date:', typeof assignment.work_date);
            console.log('Value of work_date:', assignment.work_date);
            const date = assignment.work_date.toISOString().split('T')[0];
            if (!assignmentsByDate[date]) {
                assignmentsByDate[date] = [];
            }
            assignmentsByDate[date].push({
                id: assignment.id,
                employee: assignment.employee,
                shift: assignment.shift,
                position: assignment.position,
                status: assignment.status,
                notes: assignment.notes
            });
        });

        // Статистика
        const stats = {
            total_assignments: assignments.length,
            employees_used: [...new Set(assignments.map(a => a.emp_id))].length,
            coverage_by_day: Object.keys(assignmentsByDate).reduce((acc, date) => {
                acc[date] = assignmentsByDate[date].length;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: {
                schedule: {
                    id: schedule.id,
                    start_date: schedule.start_date,
                    end_date: schedule.end_date,
                    status: schedule.status,
                    work_site: schedule.workSite,
                    created_at: schedule.createdAt,
                    metadata: schedule.text_file ? JSON.parse(schedule.text_file) : null
                },
                assignments_by_date: assignmentsByDate,
                statistics: stats
            }
        });

    } catch (error) {
        console.error('[ScheduleController] Error getting schedule details:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving schedule details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Обновить статус расписания (draft -> published)
exports.updateScheduleStatus = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { status } = req.body;

        if (!['draft', 'published', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: draft, published, or archived'
            });
        }

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        await schedule.update({ status });

        res.json({
            success: true,
            message: `Schedule status updated to ${status}`,
            data: schedule
        });

    } catch (error) {
        console.error('[ScheduleController] Error updating schedule status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating schedule status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};