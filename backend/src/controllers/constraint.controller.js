// backend/src/controllers/constraint.controller.js
const { ConstraintType, Employee, Shift, ScheduleSettings } = require('../models/associations');
const { Op } = require('sequelize');
const {query} = require("../config/db.config");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');


dayjs.extend(utc);
dayjs.extend(timezone);

// Set locale to start week on Sunday
dayjs.locale({
    ...dayjs.Ls.en,
    weekStart: 0
});

const ISRAEL_TIMEZONE = 'Asia/Jerusalem';
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Calculate next week boundaries in Israel timezone
 */
function calculateNextWeekBounds() {
    try {
        // Get current date in Israel timezone
        const now = dayjs().tz(ISRAEL_TIMEZONE);

        // Calculate next week (add 7 days, then get week bounds)
        const nextWeek = now.add(7, 'day');

        // Use native JavaScript Date for accurate day calculation
        const jsDate = new Date(nextWeek.format('YYYY-MM-DD'));
        const dayOfWeek = jsDate.getDay();

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

        // Format as strings
        const weekStartStr = weekStart.format(DATE_FORMAT);
        const weekEndStr = weekEnd.format(DATE_FORMAT);

        console.log(`[Next Week Calculation] Current: ${now.format('YYYY-MM-DD dddd')}`);
        console.log(`[Next Week Calculation] Next week: ${weekStartStr} (${weekStart.format('dddd')}) to ${weekEndStr} (${weekEnd.format('dddd')})`);

        return {
            weekStart,
            weekEnd,
            weekStartStr,
            weekEndStr
        };
    } catch (error) {
        console.error('[Next Week Calculation] Error:', error);
        throw new Error('Error calculating next week');
    }
}

/**
 * Get constraint limits from schedule settings
 */
async function getConstraintLimits() {
    try {
        const settings = await ScheduleSettings.findOne({
            order: [['createdAt', 'DESC']]
        });

        return {
            cannot_work_days: settings?.max_cannot_work_days || 3,
            prefer_work_days: 5, // Default for now, can be added to settings later
            constraint_deadline_hours: settings?.constraint_deadline_hours || 72
        };
    } catch (error) {
        console.error('[Constraint Limits] Error:', error);
        return {
            cannot_work_days: 3,
            prefer_work_days: 5,
            constraint_deadline_hours: 72
        };
    }
}

/**
 * Calculate constraint submission deadline
 */
function calculateConstraintDeadline(weekStart, deadlineHours = 72) {
    // Deadline is X hours before week start
    const deadline = dayjs(weekStart).tz(ISRAEL_TIMEZONE).subtract(deadlineHours, 'hour');
    return deadline;
}

// Get next week schedule template for constraints
exports.getNextWeekConstraintsTemplate = async (req, res) => {
    try {
        const empId = req.userId;

        // Validate employee exists
        const employee = await Employee.findByPk(empId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Calculate next week boundaries
        const { weekStart, weekEnd, weekStartStr, weekEndStr } = calculateNextWeekBounds();

        // Get constraint limits and deadline
        const limits = await getConstraintLimits();
        const deadline = calculateConstraintDeadline(weekStart, limits.constraint_deadline_hours);
        const canEdit = dayjs().tz(ISRAEL_TIMEZONE).isBefore(deadline);

        // Get all available shifts
        const shifts = await Shift.findAll({
            attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type'],
            order: [['start_time', 'ASC']]
        });

        // Get existing constraints for next week
        const existingConstraints = await ConstraintType.findAll({
            where: {
                emp_id: empId,
                [Op.or]: [
                    // Specific date constraints in next week
                    {
                        applies_to: 'specific_date',
                        start_date: {
                            [Op.between]: [weekStartStr, weekEndStr]
                        }
                    },
                    // Day of week constraints (always apply)
                    {
                        applies_to: 'day_of_week'
                    }
                ]
            }
        });

        // Build week template with existing constraints
        const weekTemplate = [];

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const dateStr = currentDay.format(DATE_FORMAT);
            const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][currentDay.day()];
            const dayOfWeekName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDay.day()];

            // Check for existing constraints on this day
            const dayConstraints = existingConstraints.filter(constraint => {
                return (constraint.applies_to === 'specific_date' && constraint.start_date === dateStr) ||
                    (constraint.applies_to === 'day_of_week' && constraint.day_of_week === dayOfWeekName);
            });

            // Build shifts with constraint status
            const dayShifts = shifts.map(shift => {
                // Check if this specific shift has a constraint
                const shiftConstraint = dayConstraints.find(c => c.shift_id === shift.shift_id);
                // Check if whole day has a constraint (no specific shift)
                const dayConstraint = dayConstraints.find(c => !c.shift_id);

                let status = 'neutral';
                if (shiftConstraint) {
                    status = shiftConstraint.type;
                } else if (dayConstraint) {
                    status = dayConstraint.type;
                }

                return {
                    shift_id: shift.shift_id,
                    shift_name: shift.shift_name,
                    shift_type: shift.shift_type,
                    start_time: shift.start_time,
                    duration: shift.duration,
                    status: status // 'cannot_work', 'prefer_work', 'neutral'
                };
            });

            weekTemplate.push({
                date: dateStr,
                day_name: dayName,
                day_of_week: dayOfWeekName,
                display_date: currentDay.format('DD/MM'),
                shifts: dayShifts
            });
        }

        res.json({
            success: true,
            message: 'Next week constraints template retrieved successfully',
            week: {
                start: weekStartStr,
                end: weekEndStr
            },
            constraints: {
                template: weekTemplate,
                limits: {
                    cannot_work_days: limits.cannot_work_days,
                    prefer_work_days: limits.prefer_work_days
                },
                deadline: deadline.toISOString(),
                can_edit: canEdit,
                deadline_passed: !canEdit
            },
            current_employee: {
                emp_id: empId,
                name: `${employee.first_name} ${employee.last_name}`
            },
            metadata: {
                timezone: ISRAEL_TIMEZONE,
                generated_at: dayjs().tz(ISRAEL_TIMEZONE).toISOString()
            }
        });

    } catch (error) {
        console.error('[GetNextWeekConstraintsTemplate] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving constraints template',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};





// Get all constraints for a specific employee
exports.getEmployeeConstraints = async (req, res) => {
    try {
        const empId = req.params.empId;
        const requestingUserId = req.userId;
        const requestingUserRole = req.userRole;

        // Security check: employees can only see their own constraints
        if (requestingUserRole !== 'admin' && parseInt(empId) !== requestingUserId) {
            return res.status(403).json({
                message: 'You can only view your own constraints'
            });
        }

        const { type, is_permanent, status } = req.query;

        // Build filter conditions
        const whereConditions = { emp_id: empId };
        if (type) whereConditions.type = type;
        if (is_permanent !== undefined) whereConditions.is_permanent = is_permanent === 'true';
        if (status) whereConditions.status = status;

        const constraints = await ConstraintType.findAll({
            where: whereConditions,
            include: [
                {
                    association: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    association: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration']
                },
                {
                    association: 'approver',
                    attributes: ['emp_id', 'first_name', 'last_name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(constraints);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving employee constraints',
            error: error.message
        });
    }
};

// Create a new constraint (employee submitting their preferences)
exports.createConstraint = async (req, res) => {
    try {
        const {
            type,
            priority,
            applies_to,
            start_date,
            end_date,
            day_of_week,
            shift_id,
            reason,
            emp_id,
            request_permanent = false  // НОВЫЙ ФЛАГ для запроса постоянного ограничения
        } = req.body;

        // Security check: employees can only create constraints for themselves
        if (req.userRole !== 'admin' && emp_id !== req.userId) {
            return res.status(403).json({
                message: 'You can only create constraints for yourself'
            });
        }

        // Validate employee exists
        const employee = await Employee.findByPk(emp_id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // If shift_id provided, validate shift exists
        if (shift_id) {
            const shift = await Shift.findByPk(shift_id);
            if (!shift) {
                return res.status(404).json({ message: 'Shift not found' });
            }
        }

        // Validate end_date (только если это временное ограничение с датами)
        // Clean up date fields - convert empty strings to null
        const cleanStartDate = start_date && start_date.trim() !== '' ? start_date : null;
        const cleanEndDate = end_date && end_date.trim() !== '' ? end_date : null;

// Clean up reason field
        const cleanReason = reason && reason.trim() !== '' ? reason : null;

// Validate dates if provided
        if (cleanStartDate && cleanEndDate) {
            if (new Date(cleanEndDate) < new Date(cleanStartDate)) {
                return res.status(400).json({
                    message: 'End date cannot be before start date'
                });
            }
        }

        // Для запросов постоянных ограничений - требуем причину
        if (request_permanent && !reason) {
            return res.status(400).json({
                message: 'Reason is required for permanent constraint requests'
            });
        }

        // Check constraint limits ТОЛЬКО для временных ограничений (не для запросов постоянных)
        if (type === 'cannot_work' && !request_permanent) {
            const settings = await ScheduleSettings.findOne({
                include: [{
                    association: 'workSite',
                    include: [{
                        association: 'positions',
                        where: { profession: employee.profession || 'general' },
                        required: false
                    }]
                }]
            });

            // Значение по умолчанию 3, если настройки не найдены
            const maxCannotWorkDays = settings?.max_cannot_work_days;

            // Count existing cannot_work constraints for the current week
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of the week (Sunday)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)

            const existingConstraints = await ConstraintType.count({
                where: {
                    emp_id,
                    type: 'cannot_work',
                    is_permanent: false,
                    status: 'approved', // Считаем только одобренные ограничения
                    [Op.or]: [
                        {
                            start_date: {
                                [Op.between]: [weekStart, weekEnd]
                            }
                        },
                        {
                            applies_to: 'day_of_week'
                        }
                    ]
                }
            });

            if (existingConstraints >= maxCannotWorkDays) {
                return res.status(400).json({
                    message: `Cannot exceed ${maxCannotWorkDays} 'cannot work' constraints per week`
                });
            }
        }

        // Определяем статус ограничения
        let constraintStatus;
        let isPermanent = false;

        if (request_permanent) {
            // Запрос на постоянное ограничение - всегда pending для одобрения админом
            constraintStatus = 'pending';
            isPermanent = false; // Станет true только после одобрения админом
        } else {
            // Обычное временное ограничение - сразу approved
            constraintStatus = 'approved';
            isPermanent = false;
        }


        // Create constraint
        const constraint = await ConstraintType.create({
            type,
            priority: priority || 1,
            applies_to,
            start_date: cleanStartDate,
            end_date: cleanEndDate,
            day_of_week,
            shift_id,
            reason: cleanReason,
            emp_id,
            is_permanent: isPermanent,
            status: constraintStatus
        });

        // Fetch the created constraint with associations
        const createdConstraint = await ConstraintType.findByPk(constraint.id, {
            include: [
                { association: 'employee' },
                { association: 'shift' }
            ]
        });

        const responseMessage = request_permanent
            ? 'Permanent constraint request submitted for admin approval'
            : 'Constraint created successfully';

        res.status(201).json({
            message: responseMessage,
            constraint: createdConstraint
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating constraint',
            error: error.message
        });
    }
};

// Update constraint
exports.updateConstraint = async (req, res) => {
    try {
        const id = req.params.id;
        const constraint = await ConstraintType.findByPk(id);

        if (!constraint) {
            return res.status(404).json({ message: 'Constraint not found' });
        }

        // Check permissions - employees can only edit their own non-permanent constraints
        const userRole = req.userRole;
        const userId = req.userId;

        if (userRole !== 'admin' && (constraint.emp_id !== userId || constraint.is_permanent)) {
            return res.status(403).json({
                message: 'You can only edit your own temporary constraints'
            });
        }

        await constraint.update(req.body);

        // Fetch updated constraint with associations
        const updatedConstraint = await ConstraintType.findByPk(id, {
            include: [
                { association: 'employee' },
                { association: 'shift' },
                { association: 'approver' }
            ]
        });

        res.json({
            message: 'Constraint updated successfully',
            constraint: updatedConstraint
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating constraint',
            error: error.message
        });
    }
};

// Delete constraint
exports.deleteConstraint = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Attempting to delete constraint with ID: ${id}`);
        const constraint = await ConstraintType.findByPk(id);

        if (!constraint) {
            console.log(`Constraint with ID ${id} not found`);
            return res.status(404).json({ message: 'Constraint not found' });
        }

        console.log(`Found constraint:`, constraint.toJSON());

        // Check permissions
        const userRole = req.userRole;
        const userId = req.userId;

        if (userRole !== 'admin' && constraint.emp_id !== userId) {
            return res.status(403).json({
                message: 'You can only delete your own constraints'
            });
        }

        await constraint.destroy();
        await query('COMMIT;');
        console.log(`Constraint with ID ${id} deleted successfully`);

        res.json({ message: 'Constraint deleted successfully' });
    } catch (error) {
        console.error('Delete constraint error:', error);
        res.status(500).json({
            message: 'Error deleting constraint',
            error: error.message
        });
    }
};

// Admin: Get all pending constraint requests
exports.getPendingConstraints = async (req, res) => {
    try {
        const pendingConstraints = await ConstraintType.findAll({
            where: { status: 'pending' },
            include: [
                {
                    association: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name', 'email']
                },
                {
                    association: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json(pendingConstraints);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving pending constraints',
            error: error.message
        });
    }
};

// Admin: Approve or reject constraint request
exports.reviewConstraint = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, admin_notes } = req.body; // 'approved' or 'rejected'
        const adminId = req.userId;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }

        const constraint = await ConstraintType.findByPk(id);
        if (!constraint) {
            return res.status(404).json({ message: 'Constraint not found' });
        }

        if (constraint.status !== 'pending') {
            return res.status(400).json({ message: 'Constraint is not pending review' });
        }

        // Update constraint
        await constraint.update({
            status,
            approved_by: adminId,
            admin_notes,
            is_permanent: status === 'approved' ? true : constraint.is_permanent
        });

        // Fetch updated constraint with associations
        const updatedConstraint = await ConstraintType.findByPk(id, {
            include: [
                { association: 'employee' },
                { association: 'shift' },
                { association: 'approver' }
            ]
        });

        res.json({
            message: `Constraint ${status} successfully`,
            constraint: updatedConstraint
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error reviewing constraint',
            error: error.message
        });
    }
};

// Admin: Create permanent constraint for employee
exports.createPermanentConstraint = async (req, res) => {
    try {
        const {
            emp_id,
            type,
            applies_to,
            day_of_week,
            shift_id,
            reason
        } = req.body;

        const adminId = req.userId;

        // Validate employee exists
        const employee = await Employee.findByPk(emp_id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Create permanent constraint
        const constraint = await ConstraintType.create({
            type,
            priority: 10, // High priority for permanent constraints
            applies_to,
            day_of_week,
            shift_id,
            reason,
            emp_id,
            is_permanent: true,
            status: 'approved',
            approved_by: adminId
        });

        // Fetch created constraint with associations
        const createdConstraint = await ConstraintType.findByPk(constraint.id, {
            include: [
                { association: 'employee' },
                { association: 'shift' },
                { association: 'approver' }
            ]
        });

        res.status(201).json({
            message: 'Permanent constraint created successfully',
            constraint: createdConstraint
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error creating permanent constraint',
            error: error.message
        });
    }
};

// Get constraints for a specific period (for schedule generation)
exports.getConstraintsForPeriod = async (req, res) => {
    try {
        const { start_date, end_date, site_id } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                message: 'start_date and end_date are required'
            });
        }

        const constraints = await ConstraintType.findAll({
            where: {
                status: 'approved',
                [Op.or]: [
                    // Permanent constraints
                    { is_permanent: true },
                    // Temporary constraints that overlap with the period
                    {
                        is_permanent: false,
                        [Op.and]: [
                            {
                                [Op.or]: [
                                    { start_date: { [Op.lte]: end_date } },
                                    { start_date: { [Op.is]: null } }
                                ]
                            },
                            {
                                [Op.or]: [
                                    { end_date: { [Op.gte]: start_date } },
                                    { end_date: { [Op.is]: null } }
                                ]
                            }
                        ]
                    }
                ]
            },
            include: [
                {
                    association: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name', 'status']
                },
                {
                    association: 'shift',
                    attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type']
                }
            ],
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
        });

        res.json(constraints);
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving constraints for period',
            error: error.message
        });
    }
};