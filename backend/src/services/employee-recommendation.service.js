// backend/src/services/employee-recommendation.service.js
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const {
    Employee,
    Position,
    Shift,
    EmployeeConstraint,
    ScheduleAssignment,
    Schedule
} = require('../models');

class EmployeeRecommendationService {

    static async getRecommendedEmployees(positionId, shiftId, date, excludeEmployeeIds = [], scheduleId = null) {
        try {
            console.log(`[EmployeeRecommendation] Getting recommendations for:`, {
                positionId,
                shiftId,
                date,
                excludeEmployeeIds,
                scheduleId
            });

            // Load target position and shift
            const [targetPosition, targetShift] = await Promise.all([
                Position.findByPk(positionId),
                Shift.findByPk(shiftId)
            ]);

            if (!targetPosition || !targetShift) {
                throw new Error('Position or shift not found');
            }

            // Get day of week for constraint checking
            const dayOfWeek = dayjs(date).format('dddd').toLowerCase();

            // Load all employees with their constraints
            const employees = await Employee.findAll({
                where: {
                    role: 'employee',
                    status: 'active',
                    emp_id: {
                        [Op.notIn]: excludeEmployeeIds
                    }
                },
                include: [
                    {
                        model: Position,
                        as: 'defaultPosition'
                    },
                    {
                        model: EmployeeConstraint,
                        as: 'constraints',
                        where: {
                            status: 'active',
                            [Op.or]: [
                                {
                                    applies_to: 'specific_date',
                                    target_date: date
                                },
                                {
                                    applies_to: 'day_of_week',
                                    day_of_week: dayOfWeek
                                },
                                {
                                    applies_to: 'day_of_week',
                                    day_of_week: null,
                                    shift_id: shiftId
                                }
                            ]
                        },
                        required: false
                    }
                ]
            });

            // Get ALL assignments for the week (not just this date)
            let weekAssignments = [];
            if (scheduleId) {
                // If we have scheduleId, get assignments from that schedule
                const schedule = await Schedule.findByPk(scheduleId);
                if (schedule) {
                    weekAssignments = await ScheduleAssignment.findAll({
                        where: {
                            schedule_id: scheduleId
                        },
                        include: [{ model: Shift, as: 'shift' }]
                    });
                }
            } else {
                // Otherwise, get assignments for the week around this date
                const weekStart = dayjs(date).startOf('week').format('YYYY-MM-DD');
                const weekEnd = dayjs(date).endOf('week').format('YYYY-MM-DD');

                weekAssignments = await ScheduleAssignment.findAll({
                    where: {
                        work_date: {
                            [Op.between]: [weekStart, weekEnd]
                        },
                        emp_id: {
                            [Op.in]: employees.map(e => e.emp_id)
                        }
                    },
                    include: [{ model: Shift, as: 'shift' }]
                });
            }

            console.log(`[EmployeeRecommendation] Found ${weekAssignments.length} assignments for the week`);

            // Group assignments by employee and date
            const assignmentsByEmployee = {};
            const assignmentsByDate = {};

            weekAssignments.forEach(assignment => {
                // By employee
                if (!assignmentsByEmployee[assignment.emp_id]) {
                    assignmentsByEmployee[assignment.emp_id] = [];
                }
                assignmentsByEmployee[assignment.emp_id].push(assignment);

                // By date
                const dateKey = dayjs(assignment.work_date).format('YYYY-MM-DD');
                if (!assignmentsByDate[dateKey]) {
                    assignmentsByDate[dateKey] = [];
                }
                assignmentsByDate[dateKey].push(assignment);
            });

            // Get assignments for this specific date
            const todayAssignments = assignmentsByDate[date] || [];
            console.log(`[EmployeeRecommendation] ${todayAssignments.length} assignments on ${date}`);

            // Categorize employees
            const recommendations = {
                available: [],
                cross_position: [],
                unavailable_busy: [],
                unavailable_hard: [],
                unavailable_soft: []
            };

            for (const employee of employees) {
                const evaluation = this._evaluateEmployee(
                    employee,
                    targetPosition,
                    targetShift,
                    dayOfWeek,
                    date,
                    assignmentsByEmployee[employee.emp_id] || [],
                    todayAssignments,
                    weekAssignments
                );

                const employeeData = {
                    ...employee.toJSON(),
                    recommendation: evaluation,
                    default_position_name: employee.defaultPosition?.pos_name || 'No position'
                };

                // Categorize based on evaluation
                if (evaluation.isAlreadyAssignedToday) {
                    recommendations.unavailable_busy.push({
                        ...employeeData,
                        unavailable_reason: 'already_assigned',
                        assigned_shift: evaluation.assignedShiftToday,
                        note: `Already working ${evaluation.assignedShiftToday} on this day`
                    });
                } else if (evaluation.hasRestViolation) {
                    recommendations.unavailable_busy.push({
                        ...employeeData,
                        unavailable_reason: 'rest_violation',
                        rest_details: evaluation.restViolationDetails,
                        note: evaluation.restViolationDetails.message
                    });
                } else if (evaluation.hasHardConstraint) {
                    recommendations.unavailable_hard.push({
                        ...employeeData,
                        unavailable_reason: 'hard_constraint',
                        constraint_details: evaluation.constraintDetails.filter(c => c.type === 'cannot_work')
                    });
                } else if (evaluation.hasSoftConstraint) {
                    recommendations.unavailable_soft.push({
                        ...employeeData,
                        unavailable_reason: 'soft_constraint',
                        constraint_details: evaluation.constraintDetails.filter(c => c.type === 'prefer_work'),
                        note: 'Employee prefers different time/shift'
                    });
                } else if (evaluation.isCorrectPosition) {
                    recommendations.available.push({
                        ...employeeData,
                        match_type: 'primary_position'
                    });
                } else if (evaluation.hasNoPosition) {
                    recommendations.available.push({
                        ...employeeData,
                        match_type: 'no_position',
                        note: 'Employee without assigned position'
                    });
                } else {
                    recommendations.cross_position.push({
                        ...employeeData,
                        match_type: 'cross_position',
                        original_position: employee.defaultPosition?.pos_name || 'Not set'
                    });
                }
            }

            // Sort by score
            recommendations.available.sort((a, b) => b.recommendation.score - a.recommendation.score);
            recommendations.cross_position.sort((a, b) => b.recommendation.score - a.recommendation.score);

            console.log(`[EmployeeRecommendation] Results:`, {
                available: recommendations.available.length,
                cross_position: recommendations.cross_position.length,
                unavailable_busy: recommendations.unavailable_busy.length,
                unavailable_hard: recommendations.unavailable_hard.length,
                unavailable_soft: recommendations.unavailable_soft.length
            });

            return recommendations;

        } catch (error) {
            console.error('[EmployeeRecommendation] Error:', error);
            throw error;
        }
    }

    static _evaluateEmployee(employee, targetPosition, targetShift, dayOfWeek, date, employeeWeekAssignments, todayAssignments, allWeekAssignments) {
        const evaluation = {
            canWork: true,
            score: 50,
            reasons: [],
            warnings: [],
            isCorrectPosition: false,
            hasNoPosition: false,
            hasHardConstraint: false,
            hasSoftConstraint: false,
            isAlreadyAssignedToday: false,
            hasRestViolation: false,
            constraintDetails: [],
            assignedShiftToday: null,
            restViolationDetails: null
        };

        // Check if already assigned TODAY (any shift)
        const todayAssignment = todayAssignments.find(a => a.emp_id === employee.emp_id);
        if (todayAssignment) {
            evaluation.isAlreadyAssignedToday = true;
            evaluation.canWork = false;
            evaluation.assignedShiftToday = todayAssignment.shift?.shift_name || 'Unknown shift';
            evaluation.warnings.push(`Already assigned to ${evaluation.assignedShiftToday} on this day`);
            return evaluation; // Return early - can't work two shifts same day
        }

        // Check position match
        if (!employee.default_position_id) {
            evaluation.hasNoPosition = true;
            evaluation.score += 25;
            evaluation.reasons.push('Flexible - no assigned position');
        } else if (employee.default_position_id === targetPosition.pos_id) {
            evaluation.isCorrectPosition = true;
            evaluation.score += 100;
            evaluation.reasons.push('Primary position match');
        } else {
            evaluation.score -= 20;
            evaluation.warnings.push(`Cross-position assignment (primary: ${employee.defaultPosition?.pos_name})`);
        }

        // Check rest periods with adjacent days
        const restViolation = this._checkRestViolations(
            employee.emp_id,
            employeeWeekAssignments,
            targetShift,
            date
        );

        if (restViolation) {
            evaluation.hasRestViolation = true;
            evaluation.canWork = false;
            evaluation.restViolationDetails = restViolation;
            evaluation.warnings.push(restViolation.message);
            return evaluation; // Return early - rest violation
        }

        // Check constraints
        if (employee.constraints && employee.constraints.length > 0) {
            for (const constraint of employee.constraints) {
                const constraintApplies = this._constraintApplies(constraint, dayOfWeek, targetShift.shift_id, date);

                if (constraintApplies) {
                    const constraintDetail = {
                        type: constraint.constraint_type,
                        applies_to: constraint.applies_to,
                        reason: constraint.reason || 'No reason provided',
                        day_of_week: constraint.day_of_week,
                        shift_id: constraint.shift_id
                    };

                    if (constraint.constraint_type === 'cannot_work') {
                        evaluation.hasHardConstraint = true;
                        evaluation.canWork = false;
                        evaluation.warnings.push(`Cannot work: ${constraint.reason || 'Hard constraint'}`);
                        constraintDetail.impact = 'blocking';
                    } else if (constraint.constraint_type === 'prefer_work') {
                        if (constraintApplies && constraint.shift_id === targetShift.shift_id) {
                            evaluation.score += 30;
                            evaluation.reasons.push('Prefers this shift');
                        } else {
                            evaluation.hasSoftConstraint = true;
                            evaluation.score -= 10;
                            evaluation.warnings.push('Prefers different time/shift');
                        }
                    }

                    evaluation.constraintDetails.push(constraintDetail);
                }
            }
        }

        // Add workload balance scoring
        const weeklyAssignments = employeeWeekAssignments.length;
        if (weeklyAssignments > 5) {
            evaluation.score -= (weeklyAssignments - 5) * 10;
            evaluation.warnings.push(`Already working ${weeklyAssignments} shifts this week`);
        } else if (weeklyAssignments < 3) {
            evaluation.score += 20;
            evaluation.reasons.push('Low weekly workload');
        }

        return evaluation;
    }

    static _constraintApplies(constraint, dayOfWeek, shiftId, date) {
        if (constraint.applies_to === 'specific_date') {
            return constraint.target_date === date &&
                (!constraint.shift_id || constraint.shift_id === shiftId);
        } else if (constraint.applies_to === 'day_of_week') {
            const dayMatches = !constraint.day_of_week || constraint.day_of_week === dayOfWeek;
            const shiftMatches = !constraint.shift_id || constraint.shift_id === shiftId;
            return dayMatches && shiftMatches;
        }
        return false;
    }

    static _checkRestViolations(empId, employeeAssignments, targetShift, date) {
        const targetDate = dayjs(date);

        for (const assignment of employeeAssignments) {
            if (!assignment.shift) continue;

            const assignmentDate = dayjs(assignment.work_date);
            const dayDiff = Math.abs(targetDate.diff(assignmentDate, 'day'));

            // Only check adjacent days
            if (dayDiff !== 1) continue;

            let restHours;
            let requiredRest;
            let violationType;

            if (assignmentDate.isBefore(targetDate)) {
                // Previous day assignment
                const prevShiftEnd = assignmentDate
                    .hour(parseInt(assignment.shift.start_time.split(':')[0]))
                    .add(assignment.shift.duration, 'hour');

                const targetShiftStart = targetDate
                    .hour(parseInt(targetShift.start_time.split(':')[0]));

                restHours = targetShiftStart.diff(prevShiftEnd, 'hour');
                requiredRest = assignment.shift.is_night_shift ? 12 : 8;
                violationType = 'after';

                if (restHours < requiredRest) {
                    return {
                        message: `Only ${restHours}h rest after ${assignment.shift.shift_name} (need ${requiredRest}h)`,
                        previousShift: assignment.shift.shift_name,
                        restHours,
                        requiredRest,
                        type: violationType
                    };
                }
            } else {
                // Next day assignment
                const targetShiftEnd = targetDate
                    .hour(parseInt(targetShift.start_time.split(':')[0]))
                    .add(targetShift.duration, 'hour');

                const nextShiftStart = assignmentDate
                    .hour(parseInt(assignment.shift.start_time.split(':')[0]));

                restHours = nextShiftStart.diff(targetShiftEnd, 'hour');
                requiredRest = targetShift.is_night_shift ? 12 : 8;
                violationType = 'before';

                if (restHours < requiredRest) {
                    return {
                        message: `Only ${restHours}h rest before ${assignment.shift.shift_name} (need ${requiredRest}h)`,
                        nextShift: assignment.shift.shift_name,
                        restHours,
                        requiredRest,
                        type: violationType
                    };
                }
            }
        }

        return null;
    }
}

module.exports = EmployeeRecommendationService;