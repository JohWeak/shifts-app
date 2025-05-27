// backend/src/controllers/schedule.controller.js
const { Schedule, ScheduleAssignment, Employee, Shift, Position, WorkSite } = require('../models/associations');
const { Op } = require('sequelize');

// Get weekly schedule for employee's position
exports.getWeeklySchedule = async (req, res) => {
    try {
        const empId = req.userId; // From JWT token
        const { date } = req.query; // Optional: specific week date (YYYY-MM-DD)

        // Get employee to find their position and site
        const employee = await Employee.findByPk(empId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Calculate week start and end (Sunday to Saturday)
        const targetDate = date ? new Date(date) : new Date();

        // Fix week calculation - ensure we get the correct Sunday
        const weekStart = new Date(targetDate);
        const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        // If today is Sunday (0), keep the same date
        // If today is Monday (1), go back 1 day to Sunday
        // If today is Saturday (6), go back 6 days to Sunday
        weekStart.setDate(targetDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Saturday
        weekEnd.setHours(23, 59, 59, 999);

        // Debug logging
        console.log(`Target date: ${targetDate.toDateString()} (day ${dayOfWeek})`);
        console.log(`Week start: ${weekStart.toDateString()}`);
        console.log(`Week end: ${weekEnd.toDateString()}`);

    // Проверяем что вычисления правильные
        if (weekStart.getDay() !== 0) {
            console.error('ERROR: Week start is not Sunday!');
        }
        if (weekEnd.getDay() !== 6) {
            console.error('ERROR: Week end is not Saturday!');
        }

        // Find the latest published schedule that covers this week
        const schedule = await Schedule.findOne({
            where: {
                start_date: { [Op.lte]: weekEnd },
                end_date: { [Op.gte]: weekStart },
                status: 'published'
            },
            order: [['createdAt', 'DESC']]
        });

        if (!schedule) {
            return res.json({
                message: 'No published schedule found for this week',
                week: {
                    start: weekStart.toISOString().split('T')[0],
                    end: weekEnd.toISOString().split('T')[0]
                },
                schedule: []
            });
        }

        // Get all assignments for this week
        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: schedule.id,
                work_date: {
                    [Op.between]: [weekStart, weekEnd]
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

        // Group assignments by date and shift
        const weekSchedule = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr
            );

            // Group by shift
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
                day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                shifts: Array.from(shiftsMap.values())
            });
        }

        res.json({
            message: 'Weekly schedule retrieved successfully',
            week: {
                start: weekStart.toISOString().split('T')[0],
                end: weekEnd.toISOString().split('T')[0]
            },
            current_employee: {
                emp_id: empId,
                name: `${employee.first_name} ${employee.last_name}`
            },
            schedule: weekSchedule
        });

    } catch (error) {
        console.error('Get weekly schedule error:', error);
        res.status(500).json({
            message: 'Error retrieving weekly schedule',
            error: error.message
        });
    }
};

// Get schedule for admin view (all positions, all employees)
exports.getAdminWeeklySchedule = async (req, res) => {
    try {
        const { date, site_id } = req.query;

        // Calculate week start and end
        const targetDate = date ? new Date(date) : new Date();

        // Fix week calculation - ensure we get the correct Sunday
        const weekStart = new Date(targetDate);
        const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

        // If today is Sunday (0), keep the same date
        // If today is Monday (1), go back 1 day to Sunday
        // If today is Saturday (6), go back 6 days to Sunday
        weekStart.setDate(targetDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Saturday
        weekEnd.setHours(23, 59, 59, 999);

        // Debug logging
        console.log(`Target date: ${targetDate.toDateString()} (day ${dayOfWeek})`);
        console.log(`Week start: ${weekStart.toDateString()}`);
        console.log(`Week end: ${weekEnd.toDateString()}`);

        // Проверяем что вычисления правильные
        if (weekStart.getDay() !== 0) {
            console.error('ERROR: Week start is not Sunday!');
        }
        if (weekEnd.getDay() !== 6) {
            console.error('ERROR: Week end is not Saturday!');
        }

        // Build where condition for site
        const scheduleWhere = {
            start_date: { [Op.lte]: weekEnd },
            end_date: { [Op.gte]: weekStart },
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
                message: 'No published schedule found for this week',
                week: {
                    start: weekStart.toISOString().split('T')[0],
                    end: weekEnd.toISOString().split('T')[0]
                },
                schedule: []
            });
        }

        // Get all assignments with full details
        const assignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: schedule.id,
                work_date: {
                    [Op.between]: [weekStart, weekEnd]
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

        // Group by date, position, and shift
        const adminSchedule = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayAssignments = assignments.filter(
                assignment => assignment.work_date === dateStr
            );

            // Group by position
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
                    status: assignment.assignment_status || 'scheduled'
                });
            });

            // Convert maps to arrays
            const positions = Array.from(positionsMap.values()).map(pos => ({
                ...pos,
                shifts: Array.from(pos.shifts.values())
            }));

            adminSchedule.push({
                date: dateStr,
                day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                positions: positions
            });
        }

        res.json({
            message: 'Admin weekly schedule retrieved successfully',
            week: {
                start: weekStart.toISOString().split('T')[0],
                end: weekEnd.toISOString().split('T')[0]
            },
            schedule: adminSchedule
        });

    } catch (error) {
        console.error('Get admin weekly schedule error:', error);
        res.status(500).json({
            message: 'Error retrieving admin weekly schedule',
            error: error.message
        });
    }
};