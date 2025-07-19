// frontend/src/features/employee-constraints/model/constraintSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';
import { getShiftTypeByTime } from 'shared/lib/utils/scheduleUtils';

// Async thunks
export const fetchWeeklyConstraints = createAsyncThunk(
    'constraints/fetchWeeklyConstraints',
    async ({ weekStart }) => {
        const response = await constraintAPI.getWeeklyConstraints({ weekStart });
        return response;
    }
);

export const submitWeeklyConstraints = createAsyncThunk(
    'constraints/submitWeeklyConstraints',
    async (constraintsData) => {
        const response = await constraintAPI.submitWeeklyConstraints(constraintsData);
        return response;
    }
);

export const fetchPermanentRequests = createAsyncThunk(
    'constraints/fetchPermanentRequests',
    async (empId) => {
        const response = await constraintAPI.getPermanentRequests(empId);
        return response;
    }
);

const constraintSlice = createSlice({
    name: 'constraints',
    initialState: {
        // Weekly constraints data
        weeklyTemplate: null,
        weeklyConstraints: {},
        weekStart: null,

        // Permanent requests
        permanentRequests: [],

        // UI states
        loading: false,
        submitting: false,
        error: null,
        submitStatus: null,
        limitError: '',

        // Settings
        currentMode: 'cannot_work', // 'cannot_work' | 'prefer_work'
        isSubmitted: false,
        canEdit: true,
    },
    reducers: {
        setCurrentMode: (state, action) => {
            state.currentMode = action.payload;
            state.limitError = '';
        },

        updateConstraint: (state, action) => {
            const { date, shiftType, status } = action.payload;

            if (!state.weeklyConstraints[date]) {
                state.weeklyConstraints[date] = {
                    day_status: 'neutral',
                    shifts: {}
                };
            }

            if (shiftType) {
                // Update specific shift
                state.weeklyConstraints[date].shifts[shiftType] = status;
            } else {
                // Update whole day
                state.weeklyConstraints[date].day_status = status;
                // Update all shifts for this day
                if (state.weeklyTemplate) {
                    const dayTemplate = state.weeklyTemplate.constraints.template.find(d => d.date === date);
                    if (dayTemplate) {
                        dayTemplate.shifts.forEach(shift => {
                            const type = getShiftTypeByTime(shift.start_time, shift.duration);
                            state.weeklyConstraints[date].shifts[type] = status;
                        });
                    }
                }
            }
        },

        setLimitError: (state, action) => {
            state.limitError = action.payload;
        },

        clearSubmitStatus: (state) => {
            state.submitStatus = null;
        },

        resetConstraints: (state) => {
            state.weeklyConstraints = {};
            state.limitError = '';
            state.isSubmitted = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch weekly constraints
            .addCase(fetchWeeklyConstraints.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWeeklyConstraints.fulfilled, (state, action) => {
                state.loading = false;
                state.weeklyTemplate = action.payload;
                state.isSubmitted = action.payload.constraints.already_submitted;
                state.canEdit = action.payload.constraints.can_edit;

                // Initialize constraints from template
                const initialConstraints = {};
                action.payload.constraints.template.forEach(day => {
                    initialConstraints[day.date] = {
                        day_status: day.day_status || 'neutral',
                        shifts: {}
                    };
                    day.shifts.forEach(shift => {
                        const type = getShiftTypeByTime(shift.start_time, shift.duration);
                        initialConstraints[day.date].shifts[type] = shift.status || 'neutral';                    });
                });
                state.weeklyConstraints = initialConstraints;
            })
            .addCase(fetchWeeklyConstraints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // Submit constraints
            .addCase(submitWeeklyConstraints.pending, (state) => {
                state.submitting = true;
                state.submitStatus = 'pending';
                state.error = null;
            })
            .addCase(submitWeeklyConstraints.fulfilled, (state) => {
                state.submitting = false;
                state.submitStatus = 'success';
                state.isSubmitted = true;
                state.canEdit = false;
            })
            .addCase(submitWeeklyConstraints.rejected, (state, action) => {
                state.submitting = false;
                state.submitStatus = 'error';
                state.error = action.error.message;
            });
    }
});

export const {
    setCurrentMode,
    updateConstraint,
    setLimitError,
    clearSubmitStatus,
    resetConstraints
} = constraintSlice.actions;

export default constraintSlice.reducer;