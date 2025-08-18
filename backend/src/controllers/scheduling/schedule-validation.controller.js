// backend/src/controllers/scheduling/schedule-validation.controller.js
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const db = require('../../models');
const EmployeeRecommendationService = require('../../services/employee-recommendation.service');
const constraints = require('../../config/scheduling-constraints');

class ScheduleValidationController {
    static async validateChanges(req, res) {
        try {
            const { scheduleId, changes } = req.body;
            const {
                Employee,
                Schedule,
                ScheduleAssignment,
                PositionShift
            } = db;

            // Get schedule details with shifts
            const schedule = await Schedule.findByPk(scheduleId, {
                include: [{
                    model: ScheduleAssignment,
                    as: 'assignments',
                    include: [{
                        model: PositionShift,
                        as: 'shift',
                        attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'is_night_shift']
                    }]
                }]
            });

            if (!schedule) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            // Get all shifts for the schedule
            const shifts = await PositionShift.findAll({
                where: {
                    id: {
                        [Op.in]: [...new Set([
                            ...schedule.assignments.map(a => a.shift_id),
                            ...changes.filter(c => c.action === 'assign').map(c => c.shiftId)
                        ])]
                    }
                }
            });

            const shiftMap = {};
            shifts.forEach(shift => {
                shiftMap[shift.id] = shift;
            });

            const violations = [];
            const employeeAssignments = {};

            // Build current assignments
            schedule.assignments.forEach(assignment => {
                if (!employeeAssignments[assignment.emp_id]) {
                    employeeAssignments[assignment.emp_id] = [];
                }
                employeeAssignments[assignment.emp_id].push({
                    ...assignment.toJSON(),
                    shift: assignment.shift || shiftMap[assignment.shift_id]
                });
            });

            // Apply pending changes
            changes.forEach(change => {
                if (change.action === 'assign') {
                    if (!employeeAssignments[change.empId]) {
                        employeeAssignments[change.empId] = [];
                    }
                    employeeAssignments[change.empId].push({
                        emp_id: change.empId,
                        shift_id: change.shiftId,
                        work_date: change.date,
                        position_id: change.positionId,
                        shift: shiftMap[change.shiftId]
                    });
                } else if (change.action === 'remove') {
                    if (employeeAssignments[change.empId]) {
                        employeeAssignments[change.empId] = employeeAssignments[change.empId].filter(
                            a => !(a.work_date === change.date &&
                                a.shift_id === change.shiftId &&
                                a.position_id === change.positionId)
                        );
                    }
                }
            });

            // Use the recommendation service for validation
            const recommendationService = new EmployeeRecommendationService(req.db);

            // Check violations for each employee
            for (const [empId, assignments] of Object.entries(employeeAssignments)) {
                // Sort assignments by date
                assignments.sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

                // Check rest violations between consecutive days
                for (const assignment of assignments) {
                    if (!assignment.shift) continue;

                    const restViolation = recommendationService._checkRestViolations(
                        empId,
                        assignments,
                        assignment.shift,
                        assignment.work_date
                    );

                    if (restViolation) {
                        violations.push({
                            type: 'rest_violation',
                            employeeId: parseInt(empId),
                            date: assignment.work_date,
                            ...restViolation
                        });
                    }
                }

                // Check weekly hours
                const weeklyHours = assignments.reduce((total, a) => {
                    return total + (a.shift?.duration_hours || 8);
                }, 0);

                if (weeklyHours > constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_WEEK) {
                    violations.push({
                        type: 'weekly_hours_violation',
                        employeeId: parseInt(empId),
                        totalHours: weeklyHours,
                        maxHours: constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_WEEK
                    });
                }

                // Check daily hours
                const dailyAssignments = {};
                assignments.forEach(a => {
                    if (!dailyAssignments[a.work_date]) {
                        dailyAssignments[a.work_date] = [];
                    }
                    dailyAssignments[a.work_date].push(a);
                });

                for (const [date, dayAssignments] of Object.entries(dailyAssignments)) {
                    const dailyHours = dayAssignments.reduce((total, a) => {
                        return total + (a.shift?.duration_hours || 8);
                    }, 0);

                    if (dailyHours > constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_DAY) {
                        violations.push({
                            type: 'daily_hours_violation',
                            employeeId: parseInt(empId),
                            date,
                            totalHours: dailyHours,
                            maxHours: constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_DAY
                        });
                    }
                }
            }

            // Remove duplicate violations
            const uniqueViolations = [];
            const violationKeys = new Set();

            violations.forEach(v => {
                const key = `${v.type}-${v.employeeId}-${v.date || ''}-${v.nextShift || ''}-${v.previousShift || ''}`;
                if (!violationKeys.has(key)) {
                    violationKeys.add(key);
                    uniqueViolations.push(v);
                }
            });

            // Get employee names for better display
            if (uniqueViolations.length > 0) {
                const employeeIds = [...new Set(uniqueViolations.map(v => v.employeeId))];
                const employees = await Employee.findAll({
                    where: { emp_id: employeeIds },
                    attributes: ['emp_id', 'first_name', 'last_name']
                });

                const employeeMap = {};
                employees.forEach(e => {
                    employeeMap[e.emp_id] = `${e.first_name} ${e.last_name}`;
                });

                uniqueViolations.forEach(v => {
                    v.employeeName = employeeMap[v.employeeId] || 'Unknown';
                });
            }

            res.json({ violations: uniqueViolations });

        } catch (error) {
            console.error('Validation error:', error);
            res.status(500).json({ error: 'Failed to validate changes', details: error.message });
        }
    }
}

module.exports = ScheduleValidationController;