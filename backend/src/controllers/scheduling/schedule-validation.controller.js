// backend/src/controllers/scheduling/schedule-validation.controller.js
const { Op } = require('sequelize');
require('dayjs');
const db = require('../../models');
const EmployeeRecommendationService = require('../../services/recommendations/employee-recommendation.service');
const constraints = require('../../config/scheduling-constraints');

class ScheduleValidationController {
    static async validateChanges(req, res) {
        try {
            const { scheduleId, changes } = req.body;
            const {
                Employee,
                Schedule,
                ScheduleAssignment,
                PositionShift,
            } = db;

            // Get schedule details with shifts
            const schedule = await Schedule.findByPk(scheduleId, {
                include: [{
                    model: ScheduleAssignment,
                    as: 'assignments',
                    include: [{
                        model: PositionShift,
                        as: 'shift',
                        attributes: ['id', 'shift_name', 'start_time', 'end_time', 'duration_hours', 'is_night_shift'],
                    }],
                }],
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
                            ...changes.filter(c => c.action === 'assign').map(c => c.shiftId),
                        ])],
                    },
                },
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
                    shift: assignment.shift || shiftMap[assignment.shift_id],
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
                        shift: shiftMap[change.shiftId],
                    });
                } else if (change.action === 'remove') {
                    if (employeeAssignments[change.empId]) {
                        employeeAssignments[change.empId] = employeeAssignments[change.empId].filter(
                            a => !(a.work_date === change.date &&
                                a.shift_id === change.shiftId &&
                                a.position_id === change.positionId),
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
                        assignment.work_date,
                    );

                    if (restViolation) {
                        violations.push({
                            type: 'rest_violation',
                            employeeId: parseInt(empId),
                            date: assignment.work_date,
                            ...restViolation,
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
                        maxHours: constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_WEEK,
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
                        let hours = 0;
                        
                        // For flexible assignments, calculate actual hours worked
                        if (a.assignment_type === 'flexible' && (a.custom_start_time || a.custom_end_time)) {
                            hours = ScheduleValidationController.calculateFlexibleAssignmentHours(a);
                        } else {
                            hours = a.shift?.duration_hours || 8;
                        }
                        
                        return total + hours;
                    }, 0);

                    if (dailyHours > constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_DAY) {
                        violations.push({
                            type: 'daily_hours_violation',
                            employeeId: parseInt(empId),
                            date,
                            totalHours: dailyHours,
                            maxHours: constraints.HARD_CONSTRAINTS.MAX_HOURS_PER_DAY,
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
                    attributes: ['emp_id', 'first_name', 'last_name'],
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

    // Static method to calculate hours for flexible assignments
    static calculateFlexibleAssignmentHours(assignment) {
        if (!assignment.custom_start_time && !assignment.custom_end_time && assignment.shift) {
            return assignment.shift.duration_hours || 8;
        }

        const startTime = assignment.custom_start_time || assignment.shift?.start_time || '09:00:00';
        const endTime = assignment.custom_end_time || assignment.shift?.end_time || '17:00:00';

        // Parse times and calculate duration
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let duration;
        if (endHour >= startHour) {
            // Same day
            duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        } else {
            // Overnight shift
            duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
        }

        return duration / 60; // Convert to hours
    }

    // Get flexible shift coverage for understaffing detection
    static async getFlexibleShiftCoverage(scheduleId, date, positionId, shiftId) {
        const { ScheduleAssignment, PositionShift } = db;
        
        // Get flexible shifts that span this regular shift
        const flexibleShifts = await PositionShift.findAll({
            where: {
                position_id: positionId,
                is_flexible: true,
                is_active: true,
                spans_shifts: {
                    [Op.contains]: [shiftId]
                }
            }
        });

        if (flexibleShifts.length === 0) {
            return { flexibleCoverage: 0, flexibleAssignments: [] };
        }

        // Get assignments for these flexible shifts on the given date
        const flexibleAssignments = await ScheduleAssignment.findAll({
            where: {
                schedule_id: scheduleId,
                work_date: date,
                shift_id: {
                    [Op.in]: flexibleShifts.map(fs => fs.id)
                },
                assignment_type: 'flexible',
                status: { [Op.ne]: 'absent' }
            },
            include: [
                {
                    model: db.Employee,
                    as: 'employee',
                    attributes: ['emp_id', 'first_name', 'last_name']
                },
                {
                    model: PositionShift,
                    as: 'shift',
                    attributes: ['id', 'shift_name', 'start_time', 'end_time']
                }
            ]
        });

        return {
            flexibleCoverage: flexibleAssignments.length,
            flexibleAssignments: flexibleAssignments
        };
    }

    // Calculate effective staffing including flexible assignments
    static async calculateEffectiveStaffing(scheduleId, date, positionId, shiftId) {
        const { ScheduleAssignment } = db;

        // Get regular assignments
        const regularAssignments = await ScheduleAssignment.count({
            where: {
                schedule_id: scheduleId,
                work_date: date,
                position_id: positionId,
                shift_id: shiftId,
                assignment_type: 'regular',
                status: { [Op.ne]: 'absent' }
            }
        });

        // Get flexible coverage
        const flexibleCoverage = await this.getFlexibleShiftCoverage(
            scheduleId, date, positionId, shiftId
        );

        return {
            regular: regularAssignments,
            flexible: flexibleCoverage.flexibleCoverage,
            total: regularAssignments + flexibleCoverage.flexibleCoverage,
            flexibleAssignments: flexibleCoverage.flexibleAssignments
        };
    }
}

module.exports = ScheduleValidationController;