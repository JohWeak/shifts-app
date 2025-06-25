// backend/src/controllers/schedule/schedule-employee.controller.js
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const {
    calculateWeekBounds,
    getHebrewDayName,
    formatDisplayDate,
    ISRAEL_TIMEZONE,
    DATE_FORMAT
} = require('./helpers/date-helpers');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    Shift,
    Position
} = db;

const getWeeklySchedule = async (req, res) => {
    try {
        const empId = req.userId;
        const { date } = req.query;

        const employee = await Employee.findByPk(empId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const { weekStartStr, weekEndStr } = calculateWeekBounds(date);

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

            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr
            );

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

module.exports = {
    getWeeklySchedule,
    getAdminWeeklySchedule
};