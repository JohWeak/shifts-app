//frontend/src/features/admin-schedule-management/ui/ScheduleView/components/Position/hooks/usePositionScheduleData.js

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getWeekDates } from 'shared/lib/utils/scheduleUtils';

export const usePositionScheduleData = (scheduleDetails, position, pendingChanges) => {
    const { systemSettings } = useSelector(state => state.settings);
    const weekStartDay = systemSettings?.weekStartDay || 0;

    const weekDates = useMemo(() => {
        if (!scheduleDetails?.schedule?.start_date) return [];
        return getWeekDates(scheduleDetails.schedule.start_date, weekStartDay);
    }, [scheduleDetails?.schedule?.start_date, weekStartDay]);

    const assignments = useMemo(() => {
        if (!scheduleDetails?.assignments) return [];
        return scheduleDetails.assignments.filter(a => {
            const assignmentPosId = a.pos_id || a.position_id;
            return assignmentPosId === position.pos_id && a.assignment_type !== 'flexible';
        });
    }, [position.pos_id, scheduleDetails?.assignments]);

    const defaultShifts = useMemo(() => [
        { shift_id: 1, shift_name: 'Morning', shift_type: 'morning', start_time: '06:00:00', duration: 8 },
        { shift_id: 2, shift_name: 'Day', shift_type: 'day', start_time: '14:00:00', duration: 8 },
        { shift_id: 3, shift_name: 'Night', shift_type: 'night', start_time: '22:00:00', duration: 8 }
    ], []);

    const shifts = useMemo(() => {
        if (position.shifts && position.shifts.length > 0) {
            // Filter out flexible shifts from display
            return position.shifts.filter(shift => !shift.is_flexible);
        }
        if (scheduleDetails?.shifts) {
            return scheduleDetails.shifts.filter(s =>
                (!s.position_id || s.position_id === position.pos_id) && !s.is_flexible
            );
        }
        return defaultShifts;
    }, [position.shifts, scheduleDetails?.shifts, position.pos_id, defaultShifts]);

    const positionPendingChanges = useMemo(() => {
        return Object.values(pendingChanges).filter(
            change => change.positionId === position.pos_id
        );
    }, [pendingChanges, position.pos_id]);

    const currentStats = useMemo(() => {
        let currentAssignments = assignments.length;
        let addedCount = 0;
        let removedCount = 0;

        positionPendingChanges.forEach(change => {
            if (change.action === 'assign') {
                addedCount++;
            } else if (change.action === 'remove') {
                removedCount++;
            } else if (change.action === 'replace') {
                addedCount++;
                if (change.employeeIdToReplace) {
                    removedCount++;
                }
            }
        });

        const totalCurrent = currentAssignments + addedCount - removedCount;

        return {
            current: currentAssignments,
            afterChanges: totalCurrent,
            added: addedCount,
            removed: removedCount
        };
    }, [assignments.length, positionPendingChanges]);

    const totalRequired = useMemo(() => {
        if (position.total_required_assignments) {
            return position.total_required_assignments;
        }
        let total = 0;
        if (position.shift_requirements) {
            Object.values(position.shift_requirements).forEach(requirements => {
                if (typeof requirements === 'object') {
                    Object.values(requirements).forEach(dayReq => total += (dayReq || 1));
                } else {
                    total += (requirements * 7);
                }
            });
        } else {
            const numShifts = shifts.length || 1;
            const daysInWeek = 7;
            const defaultStaff = position.num_of_emp || 1;
            total = numShifts * daysInWeek * defaultStaff;
        }
        return total;
    }, [position, shifts]);

    const shortage = totalRequired - currentStats.afterChanges;

    const uniqueEmployees = useMemo(() => {
        const unique = new Set();
        assignments.forEach(a => {
            if (a.emp_id) unique.add(a.emp_id);
        });

        positionPendingChanges.forEach(change => {
            if ((change.action === 'assign' || change.action === 'replace') && change.empId) {
                unique.add(change.empId);
            }
            if (change.action === 'remove' && change.empId) {
                unique.delete(change.empId);
            }
        });

        return unique.size;
    }, [assignments, positionPendingChanges]);


    return {
        weekDates,
        assignments,
        shifts,
        employees: scheduleDetails?.employees || [],
        positionPendingChanges,
        currentStats,
        totalRequired,
        shortage,
        uniqueEmployees,
    };
};