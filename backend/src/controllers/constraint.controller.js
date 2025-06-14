// backend/src/controllers/constraint.controller.js

module.exports = (db) => {
    const {EmployeeConstraint, Employee, Shift, ScheduleSettings} = db;
    const {Op} = require('sequelize');
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
            const now = dayjs().tz(ISRAEL_TIMEZONE);
            const nextWeek = now.add(7, 'day');
            const jsDate = new Date(nextWeek.format('YYYY-MM-DD'));
            const daysToSubtract = jsDate.getDay();

            const weekStartJs = new Date(jsDate);
            weekStartJs.setDate(jsDate.getDate() - daysToSubtract);

            const weekEndJs = new Date(weekStartJs);
            weekEndJs.setDate(weekStartJs.getDate() + 6);

            const weekStart = dayjs(weekStartJs).tz(ISRAEL_TIMEZONE);
            const weekEnd = dayjs(weekEndJs).tz(ISRAEL_TIMEZONE);

            const weekStartStr = weekStart.format(DATE_FORMAT);
            const weekEndStr = weekEnd.format(DATE_FORMAT);

            console.log(`[Next Week Calculation] Week: ${weekStartStr} to ${weekEndStr}`);

            return {weekStart, weekEnd, weekStartStr, weekEndStr};
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
                prefer_work_days: 5,
                constraint_deadline_hours: 72
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
        const deadline = dayjs(weekStart).tz(ISRAEL_TIMEZONE).subtract(deadlineHours, 'hour');
        return deadline;
    }

    const controller = {};

// Get weekly constraints grid with existing employee constraints
    controller.getWeeklyConstraintsGrid = async (req, res) => {
        try {
            const empId = req.userId;
            const {weekStartStr, weekEndStr} = calculateNextWeekBounds();

            // Get settings and limits
            const limits = await getConstraintLimits();
            const weekStart = dayjs(weekStartStr);
            const deadline = calculateConstraintDeadline(weekStart, limits.constraint_deadline_hours);
            const canEdit = true; // Можно сделать более сложную логику

            // Get shifts
            const shifts = await Shift.findAll({
                attributes: ['shift_id', 'shift_name', 'start_time', 'duration', 'shift_type'],
                order: [['start_time', 'ASC']]
            });

            // Get existing constraints for this week
            const existingConstraints = await EmployeeConstraint.findAll({
                where: {
                    emp_id: empId,
                    applies_to: 'specific_date',
                    target_date: {
                        [Op.between]: [weekStartStr, weekEndStr]
                    },
                    is_permanent: false,
                    status: 'active'
                }
            });

            console.log(`[WeeklyGrid] Found ${existingConstraints.length} existing constraints for employee ${empId}`);

            // Check if constraints already submitted for this week
            const hasSubmittedConstraints = existingConstraints.length > 0;

            // Create grid with existing constraints
            const weekTemplate = [];
            for (let i = 0; i < 7; i++) {
                const currentDay = weekStart.add(i, 'day');
                const dateStr = currentDay.format(DATE_FORMAT);
                const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][currentDay.day()];

                // Find constraints for this day
                const dayConstraints = existingConstraints.filter(constraint =>
                    constraint.target_date === dateStr
                );

                // Check for whole day constraint (without shift_id)
                const wholeDayConstraint = dayConstraints.find(c => !c.shift_id);

                // Create shifts with correct statuses
                const dayShifts = shifts.map(shift => {
                    let status = 'neutral';

                    if (wholeDayConstraint) {
                        status = wholeDayConstraint.constraint_type;
                    } else {
                        const shiftConstraint = dayConstraints.find(c => c.shift_id === shift.shift_id);
                        if (shiftConstraint) {
                            status = shiftConstraint.constraint_type;
                        }
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

                // Calculate day_status based on shifts
                let calculatedDayStatus = 'neutral';

                if (wholeDayConstraint) {
                    calculatedDayStatus = wholeDayConstraint.constraint_type;
                } else {
                    const shiftStatuses = dayShifts.map(s => s.status);
                    const nonNeutralStatuses = shiftStatuses.filter(s => s !== 'neutral');
                    const uniqueStatuses = [...new Set(nonNeutralStatuses)];

                    if (uniqueStatuses.length === 1 && shiftStatuses.every(s => s === uniqueStatuses[0])) {
                        calculatedDayStatus = uniqueStatuses[0];
                    }
                }

                weekTemplate.push({
                    date: dateStr,
                    day_name: dayName,
                    display_date: currentDay.format('DD/MM'),
                    shifts: dayShifts,
                    day_status: calculatedDayStatus
                });
            }

            res.json({
                success: true,
                week: {start: weekStartStr, end: weekEndStr},
                constraints: {
                    template: weekTemplate,
                    limits: {
                        cannot_work_days: limits.cannot_work_days,
                        prefer_work_days: limits.prefer_work_days
                    },
                    deadline: deadline.toISOString(),
                    can_edit: canEdit,
                    deadline_passed: !canEdit,
                    already_submitted: hasSubmittedConstraints
                }
            });
        } catch (error) {
            console.error('[WeeklyConstraintsGrid] Error:', error);
            res.status(500).json({
                success: false,
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

// Submit weekly constraints - replace all constraints for the week
    controller.submitWeeklyConstraints = async (req, res) => {
        try {
            const {week_start, constraints} = req.body;
            const emp_id = req.userId;

            if (!week_start || !constraints) {
                return res.status(400).json({
                    success: false,
                    error: 'week_start and constraints are required'
                });
            }

            // Calculate week end
            const weekStartDate = dayjs(week_start).tz(ISRAEL_TIMEZONE);
            const weekEndDate = weekStartDate.add(6, 'day');
            const weekEndStr = weekEndDate.format(DATE_FORMAT);

            // Get settings for validation
            const settings = await ScheduleSettings.findOne();
            const maxCannotWorkDays = settings?.max_cannot_work_days || 3;

            // Count constraints
            const cannotWorkCount = countConstraintDays(constraints, 'cannot_work');
            const preferWorkCount = countConstraintDays(constraints, 'prefer_work');

            // Validate limits
            if (cannotWorkCount > maxCannotWorkDays) {
                return res.status(400).json({
                    success: false,
                    error: `מקסימום ${maxCannotWorkDays} ימים של "לא יכול לעבוד"`,
                    limits_exceeded: {
                        type: 'cannot_work',
                        current: cannotWorkCount,
                        max: maxCannotWorkDays
                    }
                });
            }

            console.log(`[SubmitWeeklyConstraints] Employee ${emp_id} submitting constraints for week ${week_start}`);

            // Start transaction
            const transaction = await EmployeeConstraint.sequelize.transaction();

            try {
                // 1. Delete ALL existing constraints for this week
                await EmployeeConstraint.destroy({
                    where: {
                        emp_id,
                        applies_to: 'specific_date',
                        target_date: {
                            [Op.between]: [week_start, weekEndStr]
                        },
                        is_permanent: false
                    },
                    transaction
                });

                // 2. Create new constraints
                const constraintsToCreate = [];

                for (const [date, dayConstraints] of Object.entries(constraints)) {
                    if (date < week_start || date > weekEndStr) {
                        continue;
                    }

                    // If whole day has status (not neutral)
                    if (dayConstraints.day_status && dayConstraints.day_status !== 'neutral') {
                        // Create record for EACH shift
                        const allShifts = await Shift.findAll({transaction});

                        for (const shift of allShifts) {
                            constraintsToCreate.push({
                                constraint_type: dayConstraints.day_status,
                                applies_to: 'specific_date',
                                target_date: date,
                                shift_id: shift.shift_id,
                                emp_id,
                                is_permanent: false,
                                status: 'active'
                            });
                        }
                    } else if (dayConstraints.shifts) {
                        // Individual shifts
                        for (const [shiftType, status] of Object.entries(dayConstraints.shifts)) {
                            if (status && status !== 'neutral') {
                                // Find shift_id by shift type
                                const shift = await Shift.findOne({
                                    where: {shift_type: shiftType},
                                    transaction
                                });

                                if (shift) {
                                    constraintsToCreate.push({
                                        constraint_type: status,
                                        applies_to: 'specific_date',
                                        target_date: date,
                                        shift_id: shift.shift_id,
                                        emp_id,
                                        is_permanent: false,
                                        status: 'active'
                                    });
                                }
                            }
                        }
                    }
                }

                // 3. Create new constraints if any
                if (constraintsToCreate.length > 0) {
                    await EmployeeConstraint.bulkCreate(constraintsToCreate, {transaction});
                    console.log(`[SubmitWeeklyConstraints] Created ${constraintsToCreate.length} new constraints`);
                }

                // Commit transaction
                await transaction.commit();

                res.json({
                    success: true,
                    message: 'אילוצים נשמרו בהצלחה',
                    constraints_saved: constraintsToCreate.length,
                    week: {
                        start: week_start,
                        end: weekEndStr
                    }
                });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('[SubmitWeeklyConstraints] Error:', error);
            res.status(500).json({
                success: false,
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    };

// Get all constraints for a specific employee
    controller.getEmployeeConstraints = async (req, res) => {
        try {
            const empId = req.params.empId;
            const requestingUserId = req.userId;
            const requestingUserRole = req.userRole;

            // Security check
            if (requestingUserRole !== 'admin' && parseInt(empId) !== requestingUserId) {
                return res.status(403).json({
                    message: 'You can only view your own constraints'
                });
            }

            const {constraint_type, is_permanent, status} = req.query;

            // Build filter conditions
            const whereConditions = {emp_id: empId};
            if (constraint_type) whereConditions.constraint_type = constraint_type;
            if (is_permanent !== undefined) whereConditions.is_permanent = is_permanent === 'true';
            if (status) whereConditions.status = status;

            const constraints = await EmployeeConstraint.findAll({
                where: whereConditions,
                include: [
                    {
                        model: Employee,
                        as: 'employee',
                        attributes: ['emp_id', 'first_name', 'last_name']
                    },
                    {
                        model: Shift,
                        as: 'shift',
                        attributes: ['shift_id', 'shift_name', 'start_time', 'duration']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            res.json(constraints);
        } catch (error) {
            res.status(500).json({
                message: 'Error retrieving employee constraints',
                error: error.message
            });
        }
    };

// Create a new constraint
    controller.createConstraint = async (req, res) => {
        try {
            const {
                constraint_type,
                applies_to,
                target_date,
                day_of_week,
                shift_id,
                reason,
                emp_id,
                is_permanent = false
            } = req.body;

            // Security check
            if (req.userRole !== 'admin' && emp_id !== req.userId) {
                return res.status(403).json({
                    message: 'You can only create constraints for yourself'
                });
            }

            // Validate employee exists
            const employee = await Employee.findByPk(emp_id);
            if (!employee) {
                return res.status(404).json({message: 'Employee not found'});
            }

            // If shift_id provided, validate shift exists
            if (shift_id) {
                const shift = await Shift.findByPk(shift_id);
                if (!shift) {
                    return res.status(404).json({message: 'Shift not found'});
                }
            }

            // Clean up fields
            const cleanTargetDate = target_date && target_date.trim() !== '' ? target_date : null;
            const cleanReason = reason && reason.trim() !== '' ? reason : null;

            // Create constraint
            const constraint = await EmployeeConstraint.create({
                constraint_type,
                applies_to,
                target_date: cleanTargetDate,
                day_of_week,
                shift_id,
                reason: cleanReason,
                emp_id,
                is_permanent,
                status: 'active'
            });

            // Fetch created constraint with associations
            const createdConstraint = await EmployeeConstraint.findByPk(constraint.id, {
                include: [
                    {model: Employee, as: 'employee'},
                    {model: Shift, as: 'shift'}
                ]
            });

            res.status(201).json({
                message: 'Constraint created successfully',
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
    controller.updateConstraint = async (req, res) => {
        try {
            const id = req.params.id;
            const constraint = await EmployeeConstraint.findByPk(id);

            if (!constraint) {
                return res.status(404).json({message: 'Constraint not found'});
            }

            // Check permissions
            const userRole = req.userRole;
            const userId = req.userId;

            if (userRole !== 'admin' && (constraint.emp_id !== userId || constraint.is_permanent)) {
                return res.status(403).json({
                    message: 'You can only edit your own temporary constraints'
                });
            }

            await constraint.update(req.body);

            // Fetch updated constraint with associations
            const updatedConstraint = await EmployeeConstraint.findByPk(id, {
                include: [
                    {model: Employee, as: 'employee'},
                    {model: Shift, as: 'shift'}
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
    controller.deleteConstraint = async (req, res) => {
        try {
            const id = req.params.id;
            const constraint = await EmployeeConstraint.findByPk(id);

            if (!constraint) {
                return res.status(404).json({message: 'Constraint not found'});
            }

            // Check permissions
            const userRole = req.userRole;
            const userId = req.userId;

            if (userRole !== 'admin' && constraint.emp_id !== userId) {
                return res.status(403).json({
                    message: 'You can only delete your own constraints'
                });
            }

            await constraint.destroy();
            console.log(`Constraint with ID ${id} deleted successfully`);

            res.json({message: 'Constraint deleted successfully'});
        } catch (error) {
            console.error('Delete constraint error:', error);
            res.status(500).json({
                message: 'Error deleting constraint',
                error: error.message
            });
        }
    };

// Get constraints for a specific period (for schedule generation)
    controller.getConstraintsForPeriod = async (req, res) => {
        try {
            const {start_date, end_date, site_id} = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    message: 'start_date and end_date are required'
                });
            }

            const constraints = await EmployeeConstraint.findAll({
                where: {
                    status: 'active',
                    [Op.or]: [
                        // Permanent constraints
                        {is_permanent: true},
                        // Temporary constraints that overlap with the period
                        {
                            is_permanent: false,
                            applies_to: 'specific_date',
                            target_date: {
                                [Op.between]: [start_date, end_date]
                            }
                        }
                    ]
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
                    }
                ],
                order: [['created_at', 'ASC']]
            });

            res.json(constraints);
        } catch (error) {
            res.status(500).json({
                message: 'Error retrieving constraints for period',
                error: error.message
            });
        }
    };
    return controller;
};

/**
 * Helper function to count constraint days
 */
function countConstraintDays(constraints, constraintType) {
    const daysWithConstraint = new Set();

    Object.keys(constraints).forEach(date => {
        const dayConstraints = constraints[date];

        // Check whole day constraint
        if (dayConstraints.day_status === constraintType) {
            daysWithConstraint.add(date);
        } else if (dayConstraints.shifts) {
            // Check if any shift has this constraint
            const hasShiftConstraint = Object.values(dayConstraints.shifts)
                .some(status => status === constraintType);
            if (hasShiftConstraint) {
                daysWithConstraint.add(date);
            }
        }
    });

    return daysWithConstraint.size;
}

