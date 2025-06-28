// backend/src/services/employee-recommendation.service.js
const { Op } = require('sequelize');
const dayjs = require('dayjs');


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
                PositionShift.findByPk(shiftId) // Изменено с Shift на PositionShift
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
                        model: WorkSite,  // Добавляем загрузку WorkSite
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
                        include: [{
                            model: PositionShift,
                            as: 'shift'
                        }]
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
                    include: [{ model: PositionShift, as: 'shift' }]
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
                other_site: [],
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
                    emp_id: employee.emp_id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    default_position_id: employee.default_position_id,
                    default_position_name: employee.defaultPosition?.pos_name || null,
                    work_site_id: employee.work_site_id,
                    work_site_name: employee.workSite?.site_name || null,  // Добавляем название сайта
                    recommendation: evaluation
                };

                // Categorize based on evaluation
                if (evaluation.isAlreadyAssignedToday) {
                    recommendations.unavailable_busy.push({
                        ...employeeData,
                        unavailable_reason: 'already_assigned',
                        assigned_shift: evaluation.assignedShiftToday
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
                    // Правильная позиция, но другой сайт
                    recommendations.other_site.push({
                        ...employeeData,
                        match_type: 'other_site_same_position'
                    });
                } else if (evaluation.isOtherSite) {
                    // Другой сайт и другая позиция
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
                unavailable_soft: recommendations.unavailable_soft.length
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
            score: 50,
            reasons: [],
            warnings: [],
            isCorrectPosition: false,
            hasNoPosition: false,
            isOtherSite: false,
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
            evaluation.warnings.push(`already_assigned_to:${evaluation.assignedShiftToday}`);  // Изменено
            return evaluation; // Return early - can't work two shifts same day
        }

        // Check position match
        if (!employee.default_position_id) {
            evaluation.hasNoPosition = true;
            evaluation.score += 25;
            evaluation.reasons.push('flexible_no_position');
        } else if (employee.default_position_id === targetPosition.pos_id) {
            evaluation.isCorrectPosition = true;
            evaluation.score += 100;
            evaluation.reasons.push('primary_position_match');
        } else {
            evaluation.score -= 20;
            evaluation.warnings.push('cross_position_assignment');
        }

         // Check work site match
         if (employee.work_site_id && employee.work_site_id !== targetPosition.site_id) {
             evaluation.isOtherSite = true;
             evaluation.score -= 30;  // Снижаем приоритет для сотрудников с других сайтов
             evaluation.warnings.push('different_work_site');
         } else if (!employee.work_site_id) {
             // Сотрудник может работать на любом сайте
             evaluation.score += 10;
             evaluation.reasons.push('can_work_any_site');
         } else {
             // Тот же сайт
             evaluation.score += 20;
             evaluation.reasons.push('same_work_site');
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
                        reason: constraint.reason || 'no_reason_provided',  // Изменено
                        day_of_week: constraint.day_of_week,
                        shift_id: constraint.shift_id
                    };

                    if (constraint.constraint_type === 'cannot_work') {
                        evaluation.hasHardConstraint = true;
                        evaluation.canWork = false;
                        evaluation.warnings.push(`cannot_work_constraint:${constraint.reason || 'hard_constraint'}`);
                        constraintDetail.impact = 'blocking';
                    } else if (constraint.constraint_type === 'prefer_work') {
                        if (constraintApplies && constraint.shift_id === targetShift.shift_id) {
                            evaluation.score += 30;
                            evaluation.reasons.push('prefers_this_shift');  // Изменено
                        } else {
                            evaluation.hasSoftConstraint = true;
                            evaluation.score -= 10;
                            evaluation.warnings.push('prefers_different_time_shift');  // Изменено
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
            evaluation.warnings.push(`high_weekly_workload: ${weeklyAssignments}`);
        } else if (weeklyAssignments < 3) {
            evaluation.score += 20;
            evaluation.reasons.push(`low_weekly_workload:${weeklyAssignments}`);
        }

        return evaluation;
    }

     _constraintApplies(constraint, dayOfWeek, shiftId, date) {
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