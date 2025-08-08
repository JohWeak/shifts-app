// backend/src/services/employee-recommendations.service.js
const {Op} = require('sequelize');
const dayjs = require('dayjs');
const {EmployeeScorer, SCORING_CONFIG} = require('./employee-recommendation-scoring');

class EmployeeRecommendationService {
    constructor(db) {
        this.db = db;
    }

     async getRecommendedEmployees(
        positionId,
        shiftId,
        date,
        excludeEmployeeIds = [],
        scheduleId = null,
        virtualChanges = []
    ) {
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
        const {Op} = this.db.Sequelize;

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
                                {shift_id: shiftId},
                                {shift_id: null}
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
                            as: 'shift',
                            attributes: ['id', 'shift_name', 'start_time', 'duration_hours', 'is_night_shift']
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
                    include: [{
                        model: PositionShift,
                        as: 'shift',
                        attributes: ['id', 'shift_name', 'start_time', 'duration_hours', 'is_night_shift']
                    }]
                });
            }
            if (weekAssignments.length > 0) {
                console.log(`[EmployeeRecommendation] Sample assignments:`,
                    weekAssignments.slice(0, 3).map(a => ({
                        emp_id: a.emp_id,
                        date: a.work_date,
                        shift: a.shift?.shift_name,
                        shift_start: a.shift?.start_time
                    }))
                );
            }
            console.log(`[EmployeeRecommendation] Found ${weekAssignments.length} assignments for the week`);



            if (virtualChanges && virtualChanges.length > 0) {
                console.log(`[EmployeeRecommendation] Applying ${virtualChanges.length} virtual changes`);

                virtualChanges.filter(c => c.action === 'remove').forEach(change => {
                    weekAssignments = weekAssignments.filter(assignment =>
                        !(assignment.emp_id === change.emp_id &&
                            assignment.shift_id === change.shift_id &&
                            dayjs(assignment.work_date).format('YYYY-MM-DD') === change.date)
                    );
                });

                for (const change of virtualChanges.filter(c => c.action === 'assign')) {
                    const shift = await PositionShift.findByPk(change.shift_id);

                    if (shift) {
                        const virtualAssignment = {
                            id: `virtual_${change.emp_id}_${change.shift_id}_${change.date}`,
                            emp_id: change.emp_id,
                            position_id: change.position_id,
                            shift_id: change.shift_id,
                            work_date: change.date,
                            schedule_id: scheduleId,
                            is_virtual: true,
                            shift: shift
                        };
                        weekAssignments.push(virtualAssignment);
                    }
                }

                console.log(`[EmployeeRecommendation] After virtual changes: ${weekAssignments.length} assignments`);
            }

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
            if (virtualChanges && virtualChanges.length > 0) {
                console.log(`[EmployeeRecommendation] Virtual changes details:`, virtualChanges);
                console.log(`[EmployeeRecommendation] Today assignments after virtual changes:`,
                    todayAssignments.map(a => ({
                        emp_id: a.emp_id,
                        shift: a.shift?.shift_name,
                        is_virtual: a.is_virtual || false
                    }))
                );
            }

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
            score: 0,
            reasons: [],
            warnings: [],
            scoreBreakdown: null,
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

        // 1. Check BLOCKING factors first (score = 0)

        // Already assigned today - BLOCKING
        const todayAssignment = todayAssignments.find(a => a.emp_id === employee.emp_id);
        if (todayAssignment) {
            evaluation.isAlreadyAssignedToday = true;
            evaluation.canWork = false;
            evaluation.score = 0;
            evaluation.assignedShiftToday = todayAssignment.shift?.shift_name || 'Unknown shift';
            evaluation.warnings.push(`already_assigned_to:${evaluation.assignedShiftToday}`);
            return evaluation;
        }

        // Permanent constraints - BLOCKING
        if (employee.permanentConstraints && employee.permanentConstraints.length > 0) {
            for (const permConstraint of employee.permanentConstraints) {
                if (permConstraint.constraint_type === 'cannot_work' &&
                    (!permConstraint.shift_id || permConstraint.shift_id === targetShift.id)) {

                    evaluation.hasPermanentConstraint = true;
                    evaluation.canWork = false;
                    evaluation.score = 0;
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

        // Rest violations - BLOCKING
        const restViolation = this._checkRestViolations(
            employee.emp_id,
            employeeWeekAssignments,
            targetShift,
            date
        );

        if (restViolation) {
            evaluation.hasRestViolation = true;
            evaluation.canWork = false;
            evaluation.score = 0;
            evaluation.restViolationDetails = restViolation;
            evaluation.warnings.push(restViolation.message);
            return evaluation;
        }

        // Temporary constraints - check for BLOCKING
        let hasPreferWork = false;
        if (employee.constraints && employee.constraints.length > 0) {
            for (const constraint of employee.constraints) {
                if (constraint.shift_id && constraint.shift_id !== targetShift.id) {
                    continue;
                }

                if (constraint.constraint_type === 'cannot_work') {
                    evaluation.hasHardConstraint = true;
                    evaluation.canWork = false;
                    evaluation.score = 0;
                    evaluation.constraintDetails.push({
                        type: 'cannot_work',
                        target: constraint.shift_id ? `shift ${targetShift.shift_name}` : 'any shift',
                        date: constraint.target_date || dayOfWeek
                    });
                    return evaluation; // BLOCKING
                } else if (constraint.constraint_type === 'prefer_work') {
                    hasPreferWork = true;
                    evaluation.constraintDetails.push({
                        type: 'prefer_work',
                        target: constraint.shift_id ? `shift ${targetShift.shift_name}` : 'any shift',
                        date: constraint.target_date || dayOfWeek
                    });
                } else if (constraint.constraint_type === 'prefer_not_work') {
                    evaluation.hasSoftConstraint = true;
                    evaluation.constraintDetails.push({
                        type: 'prefer_not_work',
                        target: constraint.shift_id ? `shift ${targetShift.shift_name}` : 'any shift',
                        date: constraint.target_date || dayOfWeek
                    });
                }
            }
        }

        // 2. Employee is AVAILABLE - calculate score using EmployeeScorer
        const scoringResult = EmployeeScorer.calculateScore(
            employee,
            targetPosition,
            targetShift,
            employeeWeekAssignments
        );

        evaluation.score = scoringResult.score;
        evaluation.scoreBreakdown = scoringResult.breakdown;

        // Add preference modifiers
        if (hasPreferWork) {
            evaluation.score += SCORING_CONFIG.PREFERENCES.PREFERS_WORK;
            scoringResult.reasons.push({
                type: 'prefers_work',
                points: SCORING_CONFIG.PREFERENCES.PREFERS_WORK
            });
        } else if (evaluation.hasSoftConstraint) {
            evaluation.score += SCORING_CONFIG.PREFERENCES.PREFERS_NOT_WORK;
            scoringResult.penalties.push({
                type: 'prefers_not_work',
                points: SCORING_CONFIG.PREFERENCES.PREFERS_NOT_WORK
            });
        }

        // Ensure score doesn't go below 0
        evaluation.score = Math.max(0, evaluation.score);

        // Set evaluation flags
        evaluation.isCorrectPosition = employee.default_position_id === targetPosition.pos_id;
        evaluation.hasNoPosition = !employee.default_position_id;
        evaluation.isOtherSite = employee.work_site_id && employee.work_site_id !== targetPosition.site_id;

        // Convert scoring reasons/penalties to evaluation format (NO DUPLICATES)
        const processedReasons = new Set();

        scoringResult.reasons.forEach(reason => {
            let reasonKey = '';
            switch(reason.type) {
                case 'primary_position':
                    reasonKey = 'primary_position_match';
                    break;
                case 'flexible':
                    reasonKey = 'flexible_no_position';
                    break;
                case 'same_site':
                    reasonKey = 'same_work_site';
                    break;
                case 'any_site':
                    reasonKey = 'can_work_any_site';
                    break;
                case 'low_workload':
                    reasonKey = `low_weekly_workload:${reason.shifts}`;
                    break;
                case 'prefers_work':
                    reasonKey = 'prefers_this_shift';
                    break;
                default:
                    reasonKey = reason.type;
            }

            if (!processedReasons.has(reasonKey)) {
                evaluation.reasons.push(reasonKey);
                processedReasons.add(reasonKey);
            }
        });

        const processedWarnings = new Set();

        scoringResult.penalties.forEach(penalty => {
            let warningKey = '';
            switch(penalty.type) {
                case 'cross_position':
                    warningKey = 'cross_position_assignment';
                    break;
                case 'different_site':
                    warningKey = 'different_work_site';
                    break;
                case 'high_workload':
                    warningKey = `high_weekly_workload:${penalty.shifts}`;
                    break;
                case 'prefers_not_work':
                    warningKey = 'prefers_not_work';
                    break;
                default:
                    warningKey = penalty.type;
            }

            if (!processedWarnings.has(warningKey)) {
                evaluation.warnings.push(warningKey);
                processedWarnings.add(warningKey);
            }
        });

        return evaluation;
    }


    _checkRestViolations(empId, employeeAssignments, targetShift, date) {
        const constraints = require('../config/scheduling-constraints');
        const targetDate = dayjs(date);

        // Фильтруем назначения работника на соседние дни
        const relevantAssignments = employeeAssignments.filter(a => {
            const assignmentDate = dayjs(a.work_date);
            const dayDiff = Math.abs(assignmentDate.diff(targetDate, 'day'));
            return dayDiff === 1; // Только вчера или завтра
        });

        console.log(`[RestViolation] Checking for emp ${empId} on ${date}:`, {
            targetShift: targetShift.shift_name,
            relevantAssignments: relevantAssignments.length,
            assignments: relevantAssignments.map(a => ({
                date: a.work_date,
                shift: a.shift?.shift_name
            }))
        });

        for (const assignment of relevantAssignments) {
            if (!assignment.shift) {
                console.warn(`[RestViolation] Assignment without shift data:`, assignment);
                continue;
            }

            const assignmentDate = dayjs(assignment.work_date);
            let restHours;
            let requiredRest;
            let violationType;

            if (assignmentDate.isBefore(targetDate)) {
                // Previous day assignment (вчерашняя смена)
                const prevShiftStart = parseInt(assignment.shift.start_time.split(':')[0]);
                const prevShiftDuration = assignment.shift.duration_hours || 8;

                // Рассчитываем когда закончилась вчерашняя смена
                let prevShiftEndHour = prevShiftStart + prevShiftDuration;

                // Если смена заканчивается после полуночи
                if (prevShiftEndHour >= 24) {
                    prevShiftEndHour = prevShiftEndHour - 24;
                    // Смена перешла на сегодня
                    const targetShiftStartHour = parseInt(targetShift.start_time.split(':')[0]);
                    restHours = targetShiftStartHour - prevShiftEndHour;
                } else {
                    // Смена закончилась вчера
                    const targetShiftStartHour = parseInt(targetShift.start_time.split(':')[0]);
                    restHours = (24 - prevShiftEndHour) + targetShiftStartHour;
                }

                requiredRest = assignment.shift.is_night_shift
                    ? constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_NIGHT_SHIFT
                    : constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_REGULAR_SHIFT;
                violationType = 'after';

                console.log(`[RestViolation] Previous day check:`, {
                    prevShift: assignment.shift.shift_name,
                    prevStart: assignment.shift.start_time,
                    prevDuration: prevShiftDuration,
                    prevEndHour: prevShiftStart + prevShiftDuration,
                    targetStart: targetShift.start_time,
                    restHours,
                    requiredRest,
                    isViolation: restHours < requiredRest
                });

                if (restHours < requiredRest) {
                    return {
                        message: `rest_violation_after:${Math.floor(restHours)}:${assignment.shift.shift_name}:${requiredRest}`,
                        previousShift: assignment.shift.shift_name,
                        restHours: Math.floor(restHours),
                        requiredRest,
                        type: violationType
                    };
                }
            } else {
                // Next day assignment (завтрашняя смена)
                const targetShiftStart = parseInt(targetShift.start_time.split(':')[0]);
                const targetShiftDuration = targetShift.duration_hours || 8;

                // Рассчитываем когда закончится сегодняшняя смена
                let targetShiftEndHour = targetShiftStart + targetShiftDuration;

                const nextShiftStartHour = parseInt(assignment.shift.start_time.split(':')[0]);

                if (targetShiftEndHour >= 24) {
                    // Сегодняшняя смена заканчивается завтра
                    targetShiftEndHour = targetShiftEndHour - 24;
                    restHours = nextShiftStartHour - targetShiftEndHour;
                } else {
                    // Сегодняшняя смена заканчивается сегодня
                    restHours = (24 - targetShiftEndHour) + nextShiftStartHour;
                }

                requiredRest = targetShift.is_night_shift
                    ? constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_NIGHT_SHIFT
                    : constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_REGULAR_SHIFT;
                violationType = 'before';

                console.log(`[RestViolation] Next day check:`, {
                    targetShift: targetShift.shift_name,
                    targetStart: targetShift.start_time,
                    targetDuration: targetShiftDuration,
                    targetEndHour: targetShiftStart + targetShiftDuration,
                    nextShift: assignment.shift.shift_name,
                    nextStart: assignment.shift.start_time,
                    restHours,
                    requiredRest,
                    isViolation: restHours < requiredRest
                });

                if (restHours < requiredRest) {
                    return {
                        message: `rest_violation_before:${Math.floor(restHours)}:${assignment.shift.shift_name}:${requiredRest}`,
                        nextShift: assignment.shift.shift_name,
                        restHours: Math.floor(restHours),
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