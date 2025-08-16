// frontend/src/features/admin-schedule-management/model/hooks/useScheduleAutofill.js
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations, addPendingChange } from '../scheduleSlice';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { addNotification } from 'app/model/notificationsSlice';
import { nanoid } from '@reduxjs/toolkit';

export const useScheduleAutofill = () => {
    const dispatch = useDispatch();
    const { t } = useI18n();
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [autofilledChanges, setAutofilledChanges] = useState(new Set());

    const { scheduleDetails, pendingChanges } = useSelector(state => state.schedule);

    /**
     * Calculate missing employees for a specific position
     */
    const calculateMissingEmployees = useCallback((position, scheduleDetails, pendingChanges) => {
        const missingByShift = {};

        position.shifts?.forEach(shift => {
            const weekDates = getWeekDates(scheduleDetails.schedule.start_date);

            weekDates.forEach((date, dayIndex) => {
                const dateStr = date.toISOString().split('T')[0];
                const shiftKey = `${position.pos_id}-${shift.shift_id}-${dateStr}`;

                // Get required employees for this shift
                const requirement = position.employee_requirements?.find(
                    req => req.shift_id === shift.shift_id
                );
                const requiredCount = requirement?.employees_required || 0;

                // Count current assignments
                const currentAssignments = scheduleDetails.assignments?.filter(
                    a => a.position_id === position.pos_id &&
                        a.shift_id === shift.shift_id &&
                        a.work_date === dateStr
                ).length || 0;

                // Count pending additions
                const pendingAdditions = Object.values(pendingChanges).filter(
                    change => change.action === 'assign' &&
                        change.positionId === position.pos_id &&
                        change.shiftId === shift.shift_id &&
                        change.date === dateStr
                ).length;

                // Count pending removals
                const pendingRemovals = Object.values(pendingChanges).filter(
                    change => change.action === 'remove' &&
                        change.positionId === position.pos_id &&
                        change.shiftId === shift.shift_id &&
                        change.date === dateStr
                ).length;

                const totalAssigned = currentAssignments + pendingAdditions - pendingRemovals;
                const missing = requiredCount - totalAssigned;

                if (missing > 0) {
                    if (!missingByShift[shiftKey]) {
                        missingByShift[shiftKey] = {
                            positionId: position.pos_id,
                            shiftId: shift.shift_id,
                            date: dateStr,
                            missing,
                            dayIndex
                        };
                    }
                }
            });
        });

        return missingByShift;
    }, []);

    /**
     * Get week dates helper
     */
    const getWeekDates = (startDate) => {
        const dates = [];
        const start = new Date(startDate);
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    /**
     * Autofill a single position
     */
    const autofillPosition = useCallback(async (position) => {
        if (!scheduleDetails?.schedule?.id) {
            console.error('No schedule details available');
            return { filled: 0, total: 0, changes: [] };
        }

        const missingByShift = calculateMissingEmployees(position, scheduleDetails, pendingChanges);
        const shiftKeys = Object.keys(missingByShift);

        if (shiftKeys.length === 0) {
            return { filled: 0, total: 0, changes: [] };
        }

        let totalFilled = 0;
        let totalNeeded = 0;
        const newChanges = [];
        const usedEmployees = new Set();

        // Process each shift that needs employees
        for (const shiftKey of shiftKeys) {
            const { positionId, shiftId, date, missing } = missingByShift[shiftKey];
            totalNeeded += missing;

            try {
                // Fetch recommendations for this shift
                const result = await dispatch(fetchRecommendations({
                    positionId,
                    shiftId,
                    date,
                    scheduleId: scheduleDetails.schedule.id
                })).unwrap();

                const recommendations = result.data || result;

                // Collect employees already assigned on this date across all shifts
                const employeesOnDate = new Set();
                scheduleDetails.assignments?.forEach(a => {
                    if (a.work_date === date) {
                        employeesOnDate.add(a.emp_id);
                    }
                });

                // Add pending assignments for this date
                Object.values(pendingChanges).forEach(change => {
                    if (change.action === 'assign' && change.date === date) {
                        employeesOnDate.add(change.empId);
                    }
                });

                // Track employees we're about to assign to this shift
                const assignedToShift = new Set();

                // Priority order: available -> flexible -> cross_position -> other_site
                const categoryPriority = ['available', 'cross_position', 'other_site'];
                let filledForShift = 0;

                for (const category of categoryPriority) {
                    if (filledForShift >= missing) break;

                    const categoryEmployees = recommendations[category] || [];

                    for (const employee of categoryEmployees) {
                        if (filledForShift >= missing) break;

                        // Skip if employee is already assigned on this date
                        if (employeesOnDate.has(employee.emp_id)) continue;

                        // Skip if we've already used this employee in this autofill session
                        if (usedEmployees.has(employee.emp_id)) continue;

                        // Skip if already assigned to this specific shift
                        if (assignedToShift.has(employee.emp_id)) continue;

                        // Create pending change for this assignment
                        const changeKey = `autofill-${positionId}-${date}-${shiftId}-${employee.emp_id}-${nanoid()}`;
                        const change = {
                            action: 'assign',
                            positionId,
                            shiftId,
                            date,
                            empId: employee.emp_id,
                            empName: `${employee.first_name} ${employee.last_name}`,
                            isAutofilled: true,
                            autofillCategory: category,
                            isCrossPosition: category === 'cross_position',
                            isCrossSite: category === 'other_site'
                        };

                        dispatch(addPendingChange({ key: changeKey, change }));

                        newChanges.push(changeKey);
                        usedEmployees.add(employee.emp_id);
                        employeesOnDate.add(employee.emp_id);
                        assignedToShift.add(employee.emp_id);
                        filledForShift++;
                        totalFilled++;
                    }
                }

            } catch (error) {
                console.error(`Failed to fetch recommendations for ${shiftKey}:`, error);
            }
        }

        return { filled: totalFilled, total: totalNeeded, changes: newChanges };
    }, [dispatch, scheduleDetails, pendingChanges, calculateMissingEmployees]);

    /**
     * Autofill all positions in edit mode
     */
    const autofillAllEditingPositions = useCallback(async (editingPositions) => {
        setIsAutofilling(true);
        const allNewChanges = [];
        let totalFilled = 0;
        let totalNeeded = 0;

        try {
            // Get all positions that are in edit mode
            const positionsToFill = scheduleDetails.positions.filter(
                pos => editingPositions[pos.pos_id]
            );

            if (positionsToFill.length === 0) {
                dispatch(addNotification({
                    type: 'warning',
                    message: t('schedule.noPositionsInEditMode')
                }));
                return;
            }

            // Autofill each position
            for (const position of positionsToFill) {
                const result = await autofillPosition(position);
                totalFilled += result.filled;
                totalNeeded += result.total;
                allNewChanges.push(...result.changes);
            }

            // Store autofilled changes for styling
            setAutofilledChanges(new Set(allNewChanges));

            // Show notification based on results
            if (totalFilled === 0) {
                dispatch(addNotification({
                    type: 'info',
                    message: t('schedule.noPositionsToFill')
                }));
            } else if (totalFilled === totalNeeded) {
                dispatch(addNotification({
                    type: 'success',
                    message: t('schedule.autofillSuccess')
                }));
            } else {
                dispatch(addNotification({
                    type: 'warning',
                    message: t('schedule.autofillPartial', { filled: totalFilled, total: totalNeeded })
                }));
            }

        } catch (error) {
            console.error('Autofill failed:', error);
            dispatch(addNotification({
                type: 'error',
                message: t('schedule.autofillFailed')
            }));
        } finally {
            setIsAutofilling(false);
        }
    }, [scheduleDetails, autofillPosition, dispatch, t]);

    /**
     * Clear autofilled status when changes are saved or cancelled
     */
    const clearAutofilledStatus = useCallback(() => {
        setAutofilledChanges(new Set());
    }, []);

    /**
     * Check if a change was autofilled
     */
    const isAutofilled = useCallback((changeKey) => {
        return autofilledChanges.has(changeKey);
    }, [autofilledChanges]);

    return {
        autofillPosition,
        autofillAllEditingPositions,
        clearAutofilledStatus,
        isAutofilled,
        isAutofilling,
        autofilledChanges
    };
};