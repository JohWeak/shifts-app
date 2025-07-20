// frontend/src/features/employee-constraints/model/constraintSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

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
        },
        updateConstraint: (state, action) => {
            const { date, shiftId, status } = action.payload;

            if (!state.weeklyConstraints[date]) {
                state.weeklyConstraints[date] = { day_status: 'neutral', shifts: {} };
            }

            if (shiftId) {
                // Update specific shift
                state.weeklyConstraints[date].shifts[shiftId] = status;
            } else {
                // Update whole day
                state.weeklyConstraints[date].day_status = status;
                const dayTemplate = state.weeklyTemplate.constraints.template.find(d => d.date === date);
                if (dayTemplate) {
                    dayTemplate.shifts.forEach(shift => {
                        state.weeklyConstraints[date].shifts[shift.shift_id] = status;
                    });
                }
            }
        },
        clearSubmitStatus: (state) => {
            state.submitStatus = null;
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
            state.isSubmitted = false; // Allow re-submitting after clearing
        },

        enableEditing: (state) => {
            state.isSubmitted = false;
            state.canEdit = true;
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
                        initialConstraints[day.date].shifts[shift.shift_id] = shift.status || 'neutral';
                    });
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
    clearSubmitStatus,
    resetConstraints,
    enableEditing
} = constraintSlice.actions;

export default constraintSlice.reducer;