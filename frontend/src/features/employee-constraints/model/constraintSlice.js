// frontend/src/features/employee-constraints/model/constraintSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

// Async thunks
export const fetchConstraints = createAsyncThunk(
    'constraints/fetchConstraints',
    async ({ empId, weekStart }) => {
        const response = await constraintAPI.getWeeklyConstraints({ empId, weekStart });
        return response.data;
    }
);

export const submitConstraints = createAsyncThunk(
    'constraints/submitConstraints',
    async (constraints) => {
        const response = await constraintAPI.submitWeeklyConstraints(constraints);
        return response.data;
    }
);

export const fetchPermanentRequests = createAsyncThunk(
    'constraints/fetchPermanentRequests',
    async (empId) => {
        const response = await constraintAPI.getPermanentRequests(empId);
        return response.data;
    }
);

const constraintSlice = createSlice({
    name: 'constraints',
    initialState: {
        weeklyConstraints: [],
        permanentRequests: [],
        loading: false,
        error: null,
        submitStatus: null,
    },
    reducers: {
        clearSubmitStatus: (state) => {
            state.submitStatus = null;
        },
        updateLocalConstraint: (state, action) => {
            const { date, shiftType, constraintType } = action.payload;
            // Local state update logic
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch constraints
            .addCase(fetchConstraints.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConstraints.fulfilled, (state, action) => {
                state.loading = false;
                state.weeklyConstraints = action.payload;
            })
            .addCase(fetchConstraints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Submit constraints
            .addCase(submitConstraints.pending, (state) => {
                state.loading = true;
                state.submitStatus = 'pending';
            })
            .addCase(submitConstraints.fulfilled, (state) => {
                state.loading = false;
                state.submitStatus = 'success';
            })
            .addCase(submitConstraints.rejected, (state, action) => {
                state.loading = false;
                state.submitStatus = 'error';
                state.error = action.error.message;
            });
    }
});

export const { clearSubmitStatus, updateLocalConstraint } = constraintSlice.actions;
export default constraintSlice.reducer;