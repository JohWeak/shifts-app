// frontend/src/features/employee-constraints/model/constraintSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';
import { addNotification } from 'app/model/notificationsSlice';

const CACHE_DURATION = 10 * 60 * 1000; // 10 минут

const isCacheValid = (timestamp) => {
    if (!timestamp) return false;
    return (Date.now() - timestamp) < CACHE_DURATION;
};

export const fetchWeeklyConstraints = createAsyncThunk(
    'constraints/fetchWeekly',
    async ({ forceRefresh = false, employeeId = null } = {}, { getState, rejectWithValue }) => {
        const state = getState().constraints;
        if (!forceRefresh && state.weeklyTemplate && isCacheValid(state.lastFetched) && !employeeId) {
            return { data: state.weeklyTemplate, fromCache: true };
        }
        try {
            let response;
            if (employeeId) {
                // Admin viewing another employee's constraints
                response = await constraintAPI.getEmployeeWeeklyConstraints(employeeId, {});
            } else {
                // Employee viewing their own constraints
                response = await constraintAPI.getWeeklyConstraints({});
            }
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    },
);

// Async thunks
export const submitWeeklyConstraints = createAsyncThunk(
    'constraints/submitWeeklyConstraints',
    async ({ constraintsData, employeeId }, { dispatch }) => {
        try {
            const response = await constraintAPI.submitWeeklyConstraints(constraintsData, employeeId);

            dispatch(addNotification({
                id: 'constraint-submit-success',
                message: 'constraints.submitSuccess',
                variant: 'success',
            }));

            return response;
        } catch (error) {
            throw error;
        }
    },
);


const constraintSlice = createSlice({
    name: 'constraints',
    initialState: {
        // Weekly constraints data
        weeklyTemplate: null,
        weeklyConstraints: {},
        loading: false,
        error: null,
        lastFetched: null,

        // UI states
        submitting: false,
        submitStatus: null,
        limitError: '',
        submitError: null,

        // Settings
        currentMode: 'cannot_work', // 'cannot_work' | 'prefer_work'
        isSubmitted: false,
        canEdit: true,
        originalConstraintsOnEdit: null,
    },
    reducers: {
        setCurrentMode: (state, action) => {
            state.currentMode = action.payload;
        },
        updateConstraint: (state, action) => {
            const { date, shiftId, status } = action.payload;

            if (!state.weeklyConstraints[date]) {
                state.weeklyConstraints[date] = { day_status: 'neutral', shifts: {} };
            }

            if (shiftId) {
                // Scenario 1: Click on a specific shift
                state.weeklyConstraints[date].shifts[shiftId] = status;

                // Checking if this change violates the "all-day status".
                // If so, we reset the day's status to neutral.
                const allShiftsSame = Object.values(state.weeklyConstraints[date].shifts)
                    .every(s => s === status);
                if (!allShiftsSame) {
                    state.weeklyConstraints[date].day_status = 'neutral';
                }

            } else {
                // Scenario 2: Click on the day's header (shiftId is null)
                state.weeklyConstraints[date].day_status = status;

                // We explicitly update the status for EVERY shift on this day.
                // This is a key fix.
                if (state.weeklyTemplate) {
                    const dayTemplate = state.weeklyTemplate.constraints.template.find(d => d.date === date);
                    if (dayTemplate && dayTemplate.shifts) {
                        dayTemplate.shifts.forEach(shift => {
                            // Use shift.shift_id to access the correct key.
                            state.weeklyConstraints[date].shifts[shift.shift_id] = status;
                        });
                    }
                }
            }
        },

        resetConstraints: (state) => {
            const initialConstraints = {};
            if (state.weeklyTemplate) {
                state.weeklyTemplate.constraints.template.forEach(day => {
                    initialConstraints[day.date] = { day_status: 'neutral', shifts: {} };
                    day.shifts.forEach(shift => {
                        initialConstraints[day.date].shifts[shift.shift_id] = 'neutral';
                    });
                });
            }
            state.weeklyConstraints = initialConstraints;
            state.isSubmitted = false;
            state.canEdit = true;
            state.originalConstraintsOnEdit = null;
        },

        enableEditing: (state) => {
            state.isSubmitted = false;
            state.canEdit = true;
            state.originalConstraintsOnEdit = JSON.parse(JSON.stringify(state.weeklyConstraints));
        },
        cancelEditing: (state) => {
            // If the image exists, restore data from it.
            if (state.originalConstraintsOnEdit) {
                state.weeklyConstraints = state.originalConstraintsOnEdit;
            }
            state.isSubmitted = true;
            state.canEdit = false;
            state.originalConstraintsOnEdit = null;
        },
        clearConstraintsData: (state) => {
            state.weeklyTemplate = null;
            state.weeklyConstraints = {};
            state.loading = false;
            state.error = null;
            state.lastFetched = null;
            state.submitting = false;
            state.submitStatus = null;
            state.limitError = '';
            state.submitError = null;
            state.isSubmitted = false;
            state.canEdit = true;
            state.originalConstraintsOnEdit = null;
        },
        submissionInitiated: (state) => {
            state.isSubmitted = true;
            state.submitting = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWeeklyConstraints.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWeeklyConstraints.fulfilled, (state, action) => {
                state.loading = false;
                if (!action.payload.fromCache) {
                    const templateData = action.payload.data;
                    state.weeklyTemplate = templateData;
                    state.isSubmitted = templateData.constraints.already_submitted;
                    state.canEdit = templateData.constraints.can_edit;
                    state.lastFetched = Date.now();

                    const initialConstraints = {};
                    templateData.constraints.template.forEach(day => {
                        initialConstraints[day.date] = { day_status: 'neutral', shifts: {} };
                        let allSame = true, firstStatus = null;
                        day.shifts.forEach((shift, index) => {
                            const status = shift.status || 'neutral';
                            initialConstraints[day.date].shifts[shift.shift_id] = status;
                            if (index === 0) firstStatus = status;
                            else if (status !== firstStatus) allSame = false;
                        });
                        if (allSame && firstStatus !== 'neutral') {
                            initialConstraints[day.date].day_status = firstStatus;
                        }
                    });
                    state.weeklyConstraints = initialConstraints;
                }
            })
            .addCase(fetchWeeklyConstraints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Submit constraints
            .addCase(submitWeeklyConstraints.pending, (state) => {
                state.submitting = true;
                state.submitStatus = 'pending';
                state.error = null;
            })
            .addCase(submitWeeklyConstraints.fulfilled, (state) => {
                state.submitting = false;
                state.canEdit = false;
                state.originalConstraintsOnEdit = null;
            })
            .addCase(submitWeeklyConstraints.rejected, (state, action) => {
                state.submitting = false;
                state.isSubmitted = false;
                state.error = action.error.message;

            });
    },
});

export const {
    setCurrentMode,
    updateConstraint,
    resetConstraints,
    enableEditing,
    cancelEditing,
    submissionInitiated,
    clearConstraintsData,
} = constraintSlice.actions;

export default constraintSlice.reducer;