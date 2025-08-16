// frontend/src/features/admin-schedule-management/model/hooks/useScheduleValidation.js
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const MIN_REST_AFTER_NIGHT = 9; // hours
const MIN_REST_AFTER_REGULAR = 9; // hours
const MAX_WEEKLY_HOURS = 48;

export const useScheduleValidation = () => {
    const { t } = useI18n();
    const { scheduleDetails, pendingChanges } = useSelector(state => state.schedule);

    /**
     * Check rest time violations between shifts
     */
    const checkRestViolations = useCallback((employeeId, assignments) => {
        const violations = [];
        const sortedAssignments = [...assignments].sort((a, b) =>
            new Date(a.work_date) - new Date(b.work_date)
        );

        for (let i = 0; i < sortedAssignments.length - 1; i++) {
            const current = sortedAssignments[i];
            const next = sortedAssignments[i + 1];

            // Get shift details
            const currentShift = scheduleDetails.shifts.find(s => s.shift_id === current.shift_id);
            const nextShift = scheduleDetails.shifts.find(s => s.shift_id === next.shift_id);

            if (!currentShift || !nextShift) continue;

            // Calculate end time of current shift
            const currentEnd = new Date(`${current.work_date}T${currentShift.end_time}`);
            const nextStart = new Date(`${next.work_date}T${nextShift.start_time}`);

            // Handle overnight shifts
            if (currentShift.end_time < currentShift.start_time) {
                currentEnd.setDate(currentEnd.getDate() + 1);
            }

            const restHours = (nextStart - currentEnd) / (1000 * 60 * 60);
            const requiredRest = currentShift.shift_name.toLowerCase().includes('night') ||
            currentShift.shift_name.toLowerCase().includes('לילה')
                ? MIN_REST_AFTER_NIGHT
                : MIN_REST_AFTER_REGULAR;

            if (restHours < requiredRest) {
                violations.push({
                    type: 'rest_violation',
                    employeeId,
                    date: current.work_date,
                    nextDate: next.work_date,
                    restHours: Math.floor(restHours),
                    requiredRest,
                    currentShift: currentShift.shift_name,
                    nextShift: nextShift.shift_name
                });
            }
        }

        return violations;
    }, [scheduleDetails]);

    /**
     * Check weekly hours limit
     */
    const checkWeeklyHours = useCallback((employeeId, assignments) => {
        let totalHours = 0;

        assignments.forEach(assignment => {
            const shift = scheduleDetails.shifts.find(s => s.shift_id === assignment.shift_id);
            if (shift) {
                totalHours += shift.duration_hours;
            }
        });

        if (totalHours > MAX_WEEKLY_HOURS) {
            return {
                type: 'weekly_hours_violation',
                employeeId,
                totalHours,
                maxHours: MAX_WEEKLY_HOURS
            };
        }

        return null;
    }, [scheduleDetails]);

    /**
     * Validate all pending changes
     */
    const validatePendingChanges = useCallback(() => {
        const violations = [];
        const employeeAssignments = {};

        // Build employee assignments including pending changes
        scheduleDetails.assignments?.forEach(assignment => {
            if (!employeeAssignments[assignment.emp_id]) {
                employeeAssignments[assignment.emp_id] = [];
            }
            employeeAssignments[assignment.emp_id].push(assignment);
        });

        // Apply pending changes
        Object.values(pendingChanges).forEach(change => {
            if (change.action === 'assign') {
                if (!employeeAssignments[change.empId]) {
                    employeeAssignments[change.empId] = [];
                }
                employeeAssignments[change.empId].push({
                    emp_id: change.empId,
                    shift_id: change.shiftId,
                    work_date: change.date,
                    position_id: change.positionId
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

        // Check violations for each employee
        Object.entries(employeeAssignments).forEach(([empId, assignments]) => {
            // Check rest violations
            const restViolations = checkRestViolations(empId, assignments);
            violations.push(...restViolations);

            // Check weekly hours
            const hoursViolation = checkWeeklyHours(empId, assignments);
            if (hoursViolation) {
                violations.push(hoursViolation);
            }
        });

        return violations;
    }, [scheduleDetails, pendingChanges, checkRestViolations, checkWeeklyHours]);

    return {
        validatePendingChanges,
        checkRestViolations,
        checkWeeklyHours
    };
};