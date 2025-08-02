// backend/src/services/employee-recommendation.service.js
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Score constants
const SCORE_CONSTANTS = {
    // Base score
    BASE_SCORE: 50,

    // Position matching
    PRIMARY_POSITION_MATCH: 100,
    NO_POSITION_FLEXIBLE: 25,
    CROSS_POSITION_PENALTY: -20,

    // Work site matching
    SAME_WORK_SITE: 20,
    CAN_WORK_ANY_SITE: 10,
    DIFFERENT_WORK_SITE: -30,

    // Preferences
    PREFERS_THIS_SHIFT: 30,
    PREFERS_DIFFERENT_TIME: -10,

    // Workload balance
    LOW_WEEKLY_WORKLOAD_BONUS: 20,
    HIGH_WEEKLY_WORKLOAD_PENALTY_PER_SHIFT: -10,
    WORKLOAD_THRESHOLD_LOW: 3,
    WORKLOAD_THRESHOLD_HIGH: 5
};

class EmployeeRecommendationService {
    constructor(db) {
        this.db = db;
    }

    async getRecommendedEmployees(positionId, shiftId, date, excludeEmployeeIds = [], scheduleId = null) {
        const {
            Employee,
            WorkSite,
            Position,
            PositionShift,
            EmployeeConstraint,
            PermanentConstraint,
            ScheduleAssignment,
            Schedule
        } = this.db;
        const { Op } = this.db.Sequelize;

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
                PositionShift.findByPk(shiftId)
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
                        model: WorkSite,
                        as: 'workSite'
                    },
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
                    },
                    {
                        model: PermanentConstraint,
                        as: 'permanentConstraints',
                        where: {
                            is_active: true,
                            day_of_week: dayOfWeek,
                            [Op.or]: [
                                { shift_id: shiftId },
                                { shift_id: null }
                            ]
                        },
                        required: false,
                        include: [{
                            model: Employee,
                            as: 'approver',
                            attributes: ['emp_id', 'first_name', 'last_name']
                        }]
                    }
                ]
            });

            let weekAssignments = [];
            if (scheduleId) {
                const schedule = await Schedule.findByPk(scheduleId);
                if (schedule) {
                    weekAssignments = await ScheduleAssignment.findAll({
                        where: {
                            schedule_id: scheduleId
                        },
                        include: [{
                            model: PositionShift,
                            as: 'shift'
                        }]
                    });
                }
            } else {
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
                    include: [{ model: PositionShift, as: 'shift' }]
                });
            }

            console.log(`[EmployeeRecommendation] Found ${weekAssignments.length} assignments for the week`);

            // Group assignments by employee and date
            const assignmentsByEmployee = {};
            const assignmentsByDate = {};

            weekAssignments.forEach(assignment => {
                if (!assignmentsByEmployee[assignment.emp_id]) {
                    assignmentsByEmployee[assignment.emp_id] = [];
                }
                assignmentsByEmployee[assignment.emp_id].push(assignment);

                const dateKey = dayjs(assignment.work_date).format('YYYY-MM-DD');
                if (!assignmentsByDate[dateKey]) {
                    assignmentsByDate[dateKey] = [];
                }
                assignmentsByDate[dateKey].push(assignment);
            });

            const todayAssignments = assignmentsByDate[date] || [];
            console.log(`[EmployeeRecommendation] ${todayAssignments.length} assignments on ${date}`);

            // Categorize employees
            const recommendations = {
                available: [],
                cross_position: [],
                other_site: [],
                unavailable_busy: [],
                unavailable_hard: [],
                unavailable_soft: [],
                unavailable_permanent: []
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
                    emp_id: employee.emp_id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    default_position_id: employee.default_position_id,
                    default_position_name: employee.defaultPosition?.pos_name || null,
                    work_site_id: employee.work_site_id,
                    work_site_name: employee.workSite?.site_name || null,
                    recommendation: evaluation
                };

                // Categorize based on evaluation
                if (evaluation.isAlreadyAssignedToday) {
                    recommendations.unavailable_busy.push({
                        ...employeeData,
                        unavailable_reason: 'already_assigned',
                        assigned_shift: evaluation.assignedShiftToday
                    });
                } else if (evaluation.hasPermanentConstraint) {
                    recommendations.unavailable_permanent.push({
                        ...employeeData,
                        unavailable_reason: 'permanent_constraint',
                        constraint_details: evaluation.permanentConstraintDetails
                    });
                } else if (evaluation.hasRestViolation) {
                    recommendations.unavailable_hard.push({
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
                        note: 'prefer_different_time'
                    });
                } else if (evaluation.isOtherSite && evaluation.isCorrectPosition) {
                    recommendations.other_site.push({
                        ...employeeData,
                        match_type: 'other_site_same_position'
                    });
                } else if (evaluation.isOtherSite) {
                    recommendations.other_site.push({
                        ...employeeData,
                        match_type: 'other_site_cross_position'
                    });
                } else if (evaluation.isCorrectPosition) {
                    recommendations.available.push({
                        ...employeeData,
                        match_type: 'primary_position'
                    });
                } else if (evaluation.hasNoPosition) {
                    recommendations.available.push({
                        ...employeeData,
                        match_type: 'no_position'
                    });
                } else {
                    recommendations.cross_position.push({
                        ...employeeData,
                        match_type: 'cross_position'
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
                unavailable_soft: recommendations.unavailable_soft.length,
                unavailable_permanent: recommendations.unavailable_permanent.length
            });

            return recommendations;

        } catch (error) {
            console.error('[EmployeeRecommendation] Error:', error);
            throw error;
        }
    }

    _evaluateEmployee(employee, targetPosition, targetShift, dayOfWeek, date, employeeWeekAssignments, todayAssignments, allWeekAssignments) {
        const evaluation = {
            canWork: true,
            score: SCORE_CONSTANTS.BASE_SCORE,
            reasons: [],
            warnings: [],
            isCorrectPosition: false,
            hasNoPosition: false,
            isOtherSite: false,
            hasHardConstraint: false,
            hasSoftConstraint: false,
            hasPermanentConstraint: false,
            isAlreadyAssignedToday: false,
            hasRestViolation: false,
            constraintDetails: [],
            permanentConstraintDetails: [],
            assignedShiftToday: null,
            restViolationDetails: null
        };

        // Check if already assigned TODAY
        const todayAssignment = todayAssignments.find(a => a.emp_id === employee.emp_id);
        if (todayAssignment) {
            evaluation.isAlreadyAssignedToday = true;
            evaluation.canWork = false;
            evaluation.assignedShiftToday = todayAssignment.shift?.shift_name || 'Unknown shift';
            evaluation.warnings.push(`already_assigned_to:${evaluation.assignedShiftToday}`);
            return evaluation;
        }

        // Check permanent constraints FIRST (highest priority)
        if (employee.permanentConstraints && employee.permanentConstraints.length > 0) {
            for (const permConstraint of employee.permanentConstraints) {
                if (permConstraint.constraint_type === 'cannot_work' &&
                    (!permConstraint.shift_id || permConstraint.shift_id === targetShift.id)) {

                    evaluation.hasPermanentConstraint = true;
                    evaluation.canWork = false;
                    evaluation.permanentConstraintDetails.push({
                        type: 'permanent_cannot_work',
                        shift_name: targetShift.shift_name,
                        approved_by: permConstraint.approver ?
                            `${permConstraint.approver.first_name} ${permConstraint.approver.last_name}` :
                            'Unknown',
                        approved_at: permConstraint.approved_at,
                        message: `Permanent constraint: Cannot work ${targetShift.shift_name} on ${dayOfWeek}`
                    });

                    return evaluation;
                }
            }
        }

        // Check position match
        if (!employee.default_position_id) {
            evaluation.hasNoPosition = true;
            evaluation.score += SCORE_CONSTANTS.NO_POSITION_FLEXIBLE;
            evaluation.reasons.push('flexible_no_position');
        } else if (employee.default_position_id === targetPosition.pos_id) {
            evaluation.isCorrectPosition = true;
            evaluation.score += SCORE_CONSTANTS.PRIMARY_POSITION_MATCH;
            evaluation.reasons.push('primary_position_match');
        } else {
            evaluation.score += SCORE_CONSTANTS.CROSS_POSITION_PENALTY;
            evaluation.warnings.push('cross_position_assignment');
        }

        // Check work site match
        if (employee.work_site_id && employee.work_site_id !== targetPosition.site_id) {
            evaluation.isOtherSite = true;
            evaluation.score += SCORE_CONSTANTS.DIFFERENT_WORK_SITE;
            evaluation.warnings.push('different_work_site');
        } else if (!employee.work_site_id) {
            evaluation.score += SCORE_CONSTANTS.CAN_WORK_ANY_SITE;
            evaluation.reasons.push('can_work_any_site');
        } else {
            evaluation.score += SCORE_CONSTANTS.SAME_WORK_SITE;
            evaluation.reasons.push('same_work_site');
        }

        // Check temporary constraints
        if (employee.constraints && employee.constraints.length > 0) {
            for (const constraint of employee.constraints) {
                if (constraint.shift_id && constraint.shift_id !== targetShift.id) {
                    continue;
                }

                if (constraint.constraint_type === 'cannot_work') {
                    evaluation.hasHardConstraint = true;
                    evaluation.canWork = false;
                    evaluation.constraintDetails.push({
                        type: 'cannot_work',
                        target: constraint.shift_id ? `shift ${targetShift.shift_name}` : 'any shift',
                        date: constraint.target_date || dayOfWeek
                    });
                } else if (constraint.constraint_type === 'prefer_not_work') {
                    evaluation.hasSoftConstraint = true;
                    evaluation.score += SCORE_CONSTANTS.PREFERS_DIFFERENT_TIME;
                    evaluation.constraintDetails.push({
                        type: 'prefer_not_work',
                        target: constraint.shift_id ? `shift ${targetShift.shift_name}` : 'any shift',
                        date: constraint.target_date || dayOfWeek
                    });
                }
            }
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
            return evaluation;
        }


        // Add workload balance scoring
        const weeklyAssignments = employeeWeekAssignments.length;
        if (weeklyAssignments > SCORE_CONSTANTS.WORKLOAD_THRESHOLD_HIGH) {
            const penalty = (weeklyAssignments - SCORE_CONSTANTS.WORKLOAD_THRESHOLD_HIGH) *
                SCORE_CONSTANTS.HIGH_WEEKLY_WORKLOAD_PENALTY_PER_SHIFT;
            evaluation.score += penalty;
            evaluation.warnings.push(`high_weekly_workload: ${weeklyAssignments}`);
        } else if (weeklyAssignments < SCORE_CONSTANTS.WORKLOAD_THRESHOLD_LOW) {
            evaluation.score += SCORE_CONSTANTS.LOW_WEEKLY_WORKLOAD_BONUS;
            evaluation.reasons.push(`low_weekly_workload:${weeklyAssignments}`);
        }

        return evaluation;
    }


    _checkRestViolations(empId, employeeAssignments, targetShift, date) {
        const constraints = require('../config/scheduling-constraints');
        const targetDate = dayjs(date);
        const relevantAssignments = employeeAssignments.filter(a =>
            a.emp_id === empId &&
            Math.abs(dayjs(a.work_date).diff(targetDate, 'day')) <= 1
        );

        for (const assignment of relevantAssignments) {
            if (!assignment.shift) continue;
            const assignmentDate = dayjs(assignment.work_date);
            let restHours;
            let requiredRest;
            let violationType;

            if (assignmentDate.isBefore(targetDate)) {
                // Previous day assignment
                const prevShiftEnd = assignmentDate
                    .hour(parseInt(assignment.shift.start_time.split(':')[0]))
                    .add(assignment.shift.duration_hours, 'hour');

                const targetShiftStart = targetDate
                    .hour(parseInt(targetShift.start_time.split(':')[0]));

                restHours = targetShiftStart.diff(prevShiftEnd, 'hour');
                requiredRest = assignment.shift.is_night_shift
                    ? constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_NIGHT_SHIFT
                    : constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_REGULAR_SHIFT;
                violationType = 'after';

                if (restHours < requiredRest) {
                    return {
                        message: `rest_violation_after:${restHours}:${assignment.shift.shift_name}:${requiredRest}`,
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
                    .add(targetShift.duration_hours, 'hour');

                const nextShiftStart = assignmentDate
                    .hour(parseInt(assignment.shift.start_time.split(':')[0]));

                restHours = nextShiftStart.diff(targetShiftEnd, 'hour');
                requiredRest = targetShift.is_night_shift
                    ? constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_NIGHT_SHIFT
                    : constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_REGULAR_SHIFT;
                violationType = 'before';

                if (restHours < requiredRest) {
                    return {
                        message: `rest_violation_before:${restHours}:${assignment.shift.shift_name}:${requiredRest}`,
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