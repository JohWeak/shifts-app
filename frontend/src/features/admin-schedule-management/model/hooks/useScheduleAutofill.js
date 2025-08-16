// frontend/src/features/admin-schedule-management/model/hooks/useScheduleAutofill.js
import {useState, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchRecommendations, addPendingChange} from '../scheduleSlice';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {addNotification} from 'app/model/notificationsSlice';
import {nanoid} from '@reduxjs/toolkit';

export const useScheduleAutofill = () => {
    const dispatch = useDispatch();
    const {t} = useI18n();
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [autofilledChanges, setAutofilledChanges] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false); // Separate flag for UI updates
    const animationTimeoutRef = useRef(null);
    const {scheduleDetails, pendingChanges} = useSelector(state => state.schedule);
    /**
     * Get required staff count for specific shift and day
     */
    const getRequiredStaffCount = useCallback((shift, dayOfWeek) => {
        // First check if we have requirements array with day_of_week
        if (shift.requirements && Array.isArray(shift.requirements)) {
            const dayRequirement = shift.requirements.find(req => req.day_of_week === dayOfWeek);
            if (dayRequirement !== undefined) {
                return dayRequirement.required_staff_count || 0;
            }
        }

        // If no specific requirement found, return 0 (no staff needed)
        return 0;
    }, []);
    /**
     * Calculate missing employees for a specific position
     */
    const calculateMissingEmployees = useCallback((position, scheduleDetails, pendingChanges) => {
        const missingByShift = {};

        // Get start date from schedule
        const startDate = new Date(scheduleDetails.schedule.start_date);

        position.shifts?.forEach(shift => {
            // Check each day of the week (0 = Sunday, 6 = Saturday)
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + dayIndex);
                const dateStr = date.toISOString().split('T')[0];

                // Get day of week (0 = Sunday, 6 = Saturday)
                const dayOfWeek = date.getDay();

                // Get required count for this specific day
                let dayRequiredCount = 0;

                // Method 1: Check shift_requirements object
                if (position.shift_requirements?.[shift.shift_id]?.[dayIndex] !== undefined) {
                    dayRequiredCount = position.shift_requirements[shift.shift_id][dayIndex];
                }
                // Method 2: Check requirements array
                else if (shift.requirements && Array.isArray(shift.requirements)) {
                    const dayRequirement = shift.requirements.find(req => req.day_of_week === dayOfWeek);
                    if (dayRequirement) {
                        dayRequiredCount = dayRequirement.required_staff_count || 0;
                    }
                }

                // Skip if no staff required (0 means day off or no requirement)
                if (dayRequiredCount === 0) {
                    console.log(`No staff required for ${position.pos_name} - ${shift.shift_name} on day ${dayIndex} (${dateStr})`);
                    continue;
                }

                // Count current assignments for this shift/date
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
                const missing = dayRequiredCount - totalAssigned;

                if (missing > 0) {
                    const shiftKey = `${position.pos_id}-${shift.shift_id}-${dateStr}`;
                    missingByShift[shiftKey] = {
                        positionId: position.pos_id,
                        shiftId: shift.shift_id,
                        date: dateStr,
                        missing,
                        dayIndex,
                        dayOfWeek,
                        requiredCount: dayRequiredCount,
                        currentCount: totalAssigned
                    };

                    console.log(`Missing employees for ${position.pos_name} - ${shift.shift_name} on ${dateStr} (day ${dayIndex}):`, {
                        required: dayRequiredCount,
                        current: currentAssignments,
                        pendingAdd: pendingAdditions,
                        pendingRemove: pendingRemovals,
                        total: totalAssigned,
                        missing
                    });
                }
            }
        });

        return missingByShift;
    }, []);

    /**
     * Autofill a single position with batching
     */
    const autofillPosition = useCallback(async (position) => {
        if (!scheduleDetails?.schedule?.id) {
            console.error('No schedule details available');
            return {filled: 0, total: 0, changes: []};
        }

        setIsProcessing(true); // Start UI blocking

        console.log('Starting autofill for position:', position.pos_name);

        const missingByShift = calculateMissingEmployees(position, scheduleDetails, pendingChanges);
        const shiftKeys = Object.keys(missingByShift);

        if (shiftKeys.length === 0) {
            setIsProcessing(false);
            dispatch(addNotification({
                type: 'info',
                message: t('schedule.noPositionsToFill')
            }));
            return {filled: 0, total: 0, changes: []};
        }

        let totalFilled = 0;
        let totalNeeded = 0;
        const batchChanges = []; // Collect all changes for batch update
        const usedEmployeesByDate = {};

        // Fetch all recommendations first (parallel requests)
        const recommendationPromises = shiftKeys.map(async (shiftKey) => {
            const {positionId, shiftId, date} = missingByShift[shiftKey];
            try {
                const result = await dispatch(fetchRecommendations({
                    positionId,
                    shiftId,
                    date,
                    scheduleId: scheduleDetails.schedule.id
                })).unwrap();
                return {shiftKey, recommendations: result.data || result, ...missingByShift[shiftKey]};
            } catch (error) {
                console.error(`Failed to fetch recommendations for ${shiftKey}:`, error);
                return null;
            }
        });

        const allRecommendations = await Promise.all(recommendationPromises);

        // Process recommendations and build batch changes
        for (const recData of allRecommendations) {
            if (!recData) continue;

            const {shiftKey, recommendations, positionId, shiftId, date, missing} = recData;
            totalNeeded += missing;

            // Initialize date tracking
            if (!usedEmployeesByDate[date]) {
                usedEmployeesByDate[date] = new Set();

                scheduleDetails.assignments?.forEach(a => {
                    if (a.work_date === date) {
                        usedEmployeesByDate[date].add(a.emp_id);
                    }
                });

                Object.values(pendingChanges).forEach(change => {
                    if (change.date === date) {
                        if (change.action === 'assign') {
                            usedEmployeesByDate[date].add(change.empId);
                        } else if (change.action === 'remove') {
                            usedEmployeesByDate[date].delete(change.empId);
                        }
                    }
                });
            }

            const categoryPriority = ['available', 'flexible', 'cross_position', 'other_site'];
            let filledForShift = 0;

            for (const category of categoryPriority) {
                if (filledForShift >= missing) break;

                const categoryEmployees = recommendations[category] || [];

                for (const employee of categoryEmployees) {
                    if (filledForShift >= missing) break;

                    if (usedEmployeesByDate[date].has(employee.emp_id)) continue;

                    const changeKey = `autofill-${positionId}-${date}-${shiftId}-${employee.emp_id}-${nanoid(6)}`;
                    const change = {
                        action: 'assign',
                        positionId,
                        shiftId,
                        date,
                        empId: employee.emp_id,
                        empName: `${employee.first_name} ${employee.last_name}`,
                        isAutofilled: true,
                        autofillCategory: category,
                        isCrossPosition: category === 'cross_position' ||
                            (category === 'flexible' && employee.default_position_id !== positionId),
                        isCrossSite: category === 'other_site',
                        isFlexible: category === 'flexible'
                    };

                    batchChanges.push({key: changeKey, change});
                    usedEmployeesByDate[date].add(employee.emp_id);
                    filledForShift++;
                    totalFilled++;
                }
            }
        }

        // Apply all changes in batches with animation
        if (batchChanges.length > 0) {
            const BATCH_SIZE = 5;
            const BATCH_DELAY = 100; // ms between batches

            for (let i = 0; i < batchChanges.length; i += BATCH_SIZE) {
                const batch = batchChanges.slice(i, i + BATCH_SIZE);

                // Use requestAnimationFrame for smooth animation
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        dispatch(addBatchPendingChanges(batch));
                        setTimeout(resolve, BATCH_DELAY);
                    });
                });
            }

            // Update autofilled changes tracking
            const changeKeys = batchChanges.map(item => item.key);
            setAutofilledChanges(prev => {
                const newSet = new Set(prev);
                changeKeys.forEach(key => newSet.add(key));
                return newSet;
            });
        }

        // Keep processing state for a bit longer to ensure all UI updates complete
        setTimeout(() => {
            setIsProcessing(false);
        }, 500);

        console.log(`Autofill completed: filled ${totalFilled} of ${totalNeeded} positions`);

        return {filled: totalFilled, total: totalNeeded, changes: batchChanges.map(item => item.key)};
    }, [dispatch, scheduleDetails, pendingChanges, calculateMissingEmployees, t]);

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

            console.log(`Autofilling ${positionsToFill.length} positions`);

            // Autofill each position
            for (const position of positionsToFill) {
                const result = await autofillPosition(position);
                totalFilled += result.filled;
                totalNeeded += result.total;
                allNewChanges.push(...result.changes);
            }

            // Store all autofilled changes for styling
            setAutofilledChanges(new Set(allNewChanges));

            // Show notification based on results
            if (totalFilled === 0 && totalNeeded === 0) {
                dispatch(addNotification({
                    variant: 'info',
                    message: t('schedule.allPositionsFilled')
                }));
            } else if (totalFilled === totalNeeded && totalFilled > 0) {
                dispatch(addNotification({
                    variant: 'success',
                    message: t('schedule.autofillSuccess')
                }));
            } else if (totalFilled > 0) {
                dispatch(addNotification({
                    variant: 'warning',
                    message: t('schedule.autofillPartial', {filled: totalFilled, total: totalNeeded})
                }));
            } else {
                dispatch(addNotification({
                    variant: 'warning',
                    message: t('schedule.noAvailableEmployeesForAutofill')
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
    }, [autofillPosition, dispatch, t, scheduleDetails.positions]);

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
        autofilledChanges,
        isProcessing,
    };
};