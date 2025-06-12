// backend/src/services/employee-recommendation.service.js
const { Employee, Position, EmployeeConstraint, ScheduleAssignment, Shift } = require('../models');
const { Op } = require('sequelize');

class EmployeeRecommendationService {

    static async getRecommendedEmployees(positionId, shiftId, date, excludeEmployeeIds = []) {
        try {
            console.log(`[EmployeeRecommendation] Getting recommendations for position ${positionId}, shift ${shiftId}, date ${date}`);

            // Получить целевую позицию
            const targetPosition = await Position.findByPk(positionId);
            if (!targetPosition) {
                throw new Error('Position not found');
            }

            // Получить смену
            const targetShift = await Shift.findByPk(shiftId);
            if (!targetShift) {
                throw new Error('Shift not found');
            }

            // Получить день недели
            const dateObj = new Date(date);
            const dayOfWeek = this._getDayOfWeek(dateObj.getDay());

            // Получить всех активных сотрудников
            const employees = await Employee.findAll({
                where: {
                    status: 'active',
                    role: 'employee',
                    emp_id: { [Op.notIn]: excludeEmployeeIds }
                },
                include: [
                    {
                        model: Position,
                        as: 'defaultPosition',
                        required: false,
                        attributes: ['pos_id', 'pos_name', 'profession']
                    },
                    {
                        model: EmployeeConstraint,
                        as: 'constraints',
                        where: { status: 'active' },
                        required: false
                    }
                ]
            });

            // Проверить существующие назначения на эту дату
            const existingAssignments = await ScheduleAssignment.findAll({
                where: {
                    work_date: date,
                    emp_id: { [Op.in]: employees.map(e => e.emp_id) }
                },
                include: [
                    { model: Shift, as: 'shift' },
                    { model: Position, as: 'position' }
                ]
            });

            const busyEmployeeIds = new Set(existingAssignments.map(a => a.emp_id));

            // Новая классификация - 3 блока
            const recommendations = {
                available: [],              // Подходящая позиция + доступен
                cross_position: [],         // Другая позиция + доступен
                unavailable_busy: [],       // Уже назначен
                unavailable_hard: [],       // Жесткие ограничения (cannot_work)
                unavailable_soft: []        // Мягкие ограничения (prefer_work на другое время)
            };

            for (const employee of employees) {
                // Если уже назначен в этот день
                if (busyEmployeeIds.has(employee.emp_id)) {
                    const existingAssignment = existingAssignments.find(a => a.emp_id === employee.emp_id);
                    recommendations.unavailable_busy.push({
                        ...employee.toJSON(),
                        unavailable_reason: 'busy',
                        existing_assignment: {
                            shift_name: existingAssignment.shift.shift_name,
                            position_name: existingAssignment.position.pos_name,
                            start_time: existingAssignment.shift.start_time
                        }
                    });
                    continue;
                }

                const evaluation = this._evaluateEmployee(
                    employee,
                    targetPosition,
                    targetShift,
                    dayOfWeek,
                    date
                );

                // Классификация по новой логике
                if (evaluation.hasHardConstraint) {
                    // Жесткие ограничения (cannot_work)
                    recommendations.unavailable_hard.push({
                        ...employee.toJSON(),
                        unavailable_reason: 'hard_constraint',
                        constraint_details: evaluation.constraintDetails.filter(c => c.type === 'cannot_work')
                    });
                } else if (evaluation.hasSoftConstraint) {
                    // Мягкие ограничения (prefer_work в другое время)
                    recommendations.unavailable_soft.push({
                        ...employee.toJSON(),
                        unavailable_reason: 'soft_constraint',
                        constraint_details: evaluation.constraintDetails.filter(c => c.type === 'prefer_work'),
                        note: 'Employee prefers different time/shift'
                    });
                } else if (evaluation.isCorrectPosition) {
                    // Правильная позиция
                    recommendations.available.push({
                        ...employee.toJSON(),
                        recommendation: evaluation,
                        match_type: 'primary_position'
                    });
                } else {
                    // Другая позиция (кросс-позиционное назначение)
                    recommendations.cross_position.push({
                        ...employee.toJSON(),
                        recommendation: evaluation,
                        match_type: 'cross_position',
                        original_position: employee.defaultPosition?.pos_name || 'Not set'
                    });
                }
            }

            // Сортировка
            recommendations.available.sort((a, b) => b.recommendation.score - a.recommendation.score);
            recommendations.cross_position.sort((a, b) => b.recommendation.score - a.recommendation.score);

            console.log(`[EmployeeRecommendation] Recommendations:`, {
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

    static _evaluateEmployee(employee, targetPosition, targetShift, dayOfWeek, date) {
        const evaluation = {
            canWork: true,
            score: 50,
            reasons: [],
            warnings: [],
            isCorrectPosition: false,
            hasHardConstraint: false,
            hasSoftConstraint: false,
            constraintDetails: []
        };

        // Проверка правильности позиции
        if (employee.default_position_id === targetPosition.pos_id) {
            evaluation.isCorrectPosition = true;
            evaluation.score += 50;
            evaluation.reasons.push('Primary position match');
        } else {
            evaluation.score -= 20;
            evaluation.reasons.push(`Cross-position (from ${employee.defaultPosition?.pos_name || 'unknown'})`);
        }

        // Проверка ограничений
        if (employee.constraints && employee.constraints.length > 0) {
            for (const constraint of employee.constraints) {
                if (this._constraintApplies(constraint, dayOfWeek, targetShift.shift_id, date)) {
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
                        // Если prefer_work на ДРУГОЕ время/смену, то это мягкое ограничение
                        evaluation.hasSoftConstraint = true;
                        evaluation.score += 10; // Небольшой бонус все же
                        evaluation.reasons.push('Has preference for different time');
                        constraintDetail.impact = 'preference_conflict';
                    }

                    evaluation.constraintDetails.push(constraintDetail);
                }
            }
        }

        return evaluation;
    }

    static _constraintApplies(constraint, dayOfWeek, shiftId, date) {
        if (constraint.applies_to === 'specific_date') {
            if (constraint.target_date) {
                const constraintDate = new Date(constraint.target_date).toISOString().split('T')[0];
                const targetDate = new Date(date).toISOString().split('T')[0];
                if (constraintDate !== targetDate) {
                    return false;
                }
            }
        } else if (constraint.applies_to === 'day_of_week') {
            if (constraint.day_of_week && constraint.day_of_week !== dayOfWeek) {
                return false;
            }
        }

        // Проверка смены (если указана)
        if (constraint.shift_id && constraint.shift_id !== shiftId) {
            return false;
        }

        return true;
    }

    static _categorizeEmployee(recommendation) {
        if (!recommendation.canWork) {
            return 'alternative'; // Не должно попасть сюда, но на всякий случай
        }

        if (recommendation.isDefaultPosition) {
            if (recommendation.hasPreference) {
                return 'perfect';
            } else {
                return 'good';
            }
        } else {
            if (recommendation.hasPreference) {
                return 'acceptable';
            } else {
                return 'alternative';
            }
        }
    }

    static _getDayOfWeek(dayIndex) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayIndex];
    }
}

module.exports = EmployeeRecommendationService;