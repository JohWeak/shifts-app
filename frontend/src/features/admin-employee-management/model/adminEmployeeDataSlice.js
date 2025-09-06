// frontend/src/features/admin-employee-management/model/adminEmployeeDataSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { constraintAPI, employeeAPI, scheduleAPI } from 'shared/api/apiService';
import { addWeeks, format, parseISO } from 'date-fns';
import { CACHE_DURATION } from '../../../shared/lib/cache/cacheUtils';

const CACHE_DURATION_LONG = CACHE_DURATION.LONG;

// Helper to check cache validity
const isCacheValid = (timestamp, duration) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
};

// Admin thunks for viewing specific employee data
export const fetchEmployeeConstraintsAsAdmin = createAsyncThunk(
    'adminEmployeeData/fetchEmployeeConstraintsAsAdmin',
    async ({ employeeId, forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            const response = await constraintAPI.getEmployeeWeeklyConstraints(employeeId, {});
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch employee constraints');
        }
    },
);

export const fetchEmployeeScheduleAsAdmin = createAsyncThunk(
    'adminEmployeeData/fetchEmployeeScheduleAsAdmin',
    async ({ employeeId, forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            // Get current week schedule
            const currentResponse = await scheduleAPI.fetchWeeklySchedule(null, { emp_id: employeeId });
            const currentData = currentResponse.data || currentResponse;
            let nextData = null;

            // Get next week schedule if current week has data
            if (currentData?.week?.start) {
                const nextWeekStart = format(addWeeks(parseISO(currentData.week.start), 1), 'yyyy-MM-dd');
                const nextResponse = await scheduleAPI.fetchWeeklySchedule(nextWeekStart, { emp_id: employeeId });
                nextData = nextResponse.data || nextResponse;
            }

            return { data: { current: currentData, next: nextData }, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch employee schedule');
        }
    },
);

export const fetchEmployeeArchiveSummaryAsAdmin = createAsyncThunk(
    'adminEmployeeData/fetchEmployeeArchiveSummaryAsAdmin',
    async ({ employeeId, forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            const response = await employeeAPI.getEmployeeArchiveSummary(employeeId);
            return { data: response.data || response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch employee archive summary');
        }
    },
);

export const fetchEmployeeArchiveMonthAsAdmin = createAsyncThunk(
    'adminEmployeeData/fetchEmployeeArchiveMonthAsAdmin',
    async ({ employeeId, year, month, forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            const response = await employeeAPI.getEmployeeArchiveMonth(employeeId, year, month);
            return { data: response.data || response, month, year, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch employee archive month');
        }
    },
);

export const fetchPositionScheduleAsAdmin = createAsyncThunk(
    'adminEmployeeData/fetchPositionScheduleAsAdmin',
    async ({ positionId, forceRefresh = false }, { getState, rejectWithValue }) => {
        const { positionSchedule, positionScheduleLastFetched } = getState().adminEmployeeData;

        if (!forceRefresh && positionSchedule && isCacheValid(positionScheduleLastFetched, CACHE_DURATION_LONG)) {
            return { data: positionSchedule, fromCache: true };
        }
        try {
            const currentResponse = await scheduleAPI.fetchPositionWeeklySchedule(positionId);
            const currentData = currentResponse;
            let nextData = null;
            console.log('[fetchPositionScheduleAsAdmin] Current data:', currentData, 'Current response: ', currentResponse);
            if (currentData?.week?.start) {
                const nextWeekStart = format(addWeeks(parseISO(currentData.week.start), 1), 'yyyy-MM-dd');
                nextData = await scheduleAPI.fetchPositionWeeklySchedule(positionId, nextWeekStart);
            }
            return { data: { current: currentData, next: nextData }, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch position schedule');
        }
    },
);

// Slice
const adminEmployeeDataSlice = createSlice({
    name: 'adminEmployeeData',
    initialState: {
        // Current employee being viewed
        currentEmployeeId: null,

        // Personal schedule for viewed employee
        personalSchedule: null,
        personalScheduleLoading: false,
        personalScheduleError: null,

        // Position schedule for viewed employee
        positionSchedule: null,
        positionScheduleLastFetched: null,
        positionScheduleLoading: false,
        positionScheduleError: null,

        // Constraints for viewed employee
        constraints: null,
        constraintsLoading: false,
        constraintsError: null,

        // Archive data for viewed employee
        archiveSummary: null,
        archiveSummaryLoading: false,
        archiveSummaryError: null,
        archiveCache: {}, // { 'archive_2024-01': { data, timestamp } }
        archiveLoading: false,
        archiveError: null,
    },
    reducers: {
        setCurrentEmployeeId: (state, action) => {
            // Clear data when switching employees
            if (state.currentEmployeeId !== action.payload) {
                state.currentEmployeeId = action.payload;
                state.personalSchedule = null;
                state.positionSchedule = null;
                state.positionScheduleLastFetched = null;
                state.constraints = null;
                state.archiveSummary = null;
                state.archiveCache = {};
                // Reset errors when switching employees
                state.personalScheduleError = null;
                state.positionScheduleError = null;
                state.constraintsError = null;
                state.archiveSummaryError = null;
                state.archiveError = null;
            }
        },
        clearAllData: (state) => {
            state.currentEmployeeId = null;
            state.personalSchedule = null;
            state.positionSchedule = null;
            state.positionScheduleLastFetched = null;
            state.constraints = null;
            state.archiveSummary = null;
            state.archiveCache = {};
            state.personalScheduleError = null;
            state.positionScheduleError = null;
            state.constraintsError = null;
            state.archiveSummaryError = null;
            state.archiveError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Employee schedule as admin
            .addCase(fetchEmployeeScheduleAsAdmin.pending, (state) => {
                state.personalScheduleLoading = true;
                state.personalScheduleError = null;
            })
            .addCase(fetchEmployeeScheduleAsAdmin.fulfilled, (state, action) => {
                state.personalScheduleLoading = false;
                state.personalSchedule = action.payload.data;
            })
            .addCase(fetchEmployeeScheduleAsAdmin.rejected, (state, action) => {
                state.personalScheduleLoading = false;
                state.personalScheduleError = action.payload;
            })

            // Employee constraints as admin
            .addCase(fetchEmployeeConstraintsAsAdmin.pending, (state) => {
                state.constraintsLoading = true;
                state.constraintsError = null;
            })
            .addCase(fetchEmployeeConstraintsAsAdmin.fulfilled, (state, action) => {
                state.constraintsLoading = false;
                state.constraints = action.payload.data;
            })
            .addCase(fetchEmployeeConstraintsAsAdmin.rejected, (state, action) => {
                state.constraintsLoading = false;
                state.constraintsError = action.payload;
            })

            // Employee archive summary as admin
            .addCase(fetchEmployeeArchiveSummaryAsAdmin.pending, (state) => {
                state.archiveSummaryLoading = true;
                state.archiveSummaryError = null;
            })
            .addCase(fetchEmployeeArchiveSummaryAsAdmin.fulfilled, (state, action) => {
                state.archiveSummaryLoading = false;
                state.archiveSummary = action.payload.data;
            })
            .addCase(fetchEmployeeArchiveSummaryAsAdmin.rejected, (state, action) => {
                state.archiveSummaryLoading = false;
                state.archiveSummaryError = action.payload;
            })

            // Employee archive month as admin
            .addCase(fetchEmployeeArchiveMonthAsAdmin.pending, (state) => {
                state.archiveLoading = true;
                state.archiveError = null;
            })
            .addCase(fetchEmployeeArchiveMonthAsAdmin.fulfilled, (state, action) => {
                state.archiveLoading = false;
                const cacheKey = `${action.payload.year}-${action.payload.month}`;
                state.archiveCache[cacheKey] = {
                    data: action.payload.data,
                    timestamp: Date.now(),
                };
            })
            .addCase(fetchEmployeeArchiveMonthAsAdmin.rejected, (state, action) => {
                state.archiveLoading = false;
                state.archiveError = action.payload;
            })

            // Position schedule as admin
            .addCase(fetchPositionScheduleAsAdmin.pending, (state) => {
                state.positionScheduleLoading = true;
                state.positionScheduleError = null;
            })
            .addCase(fetchPositionScheduleAsAdmin.fulfilled, (state, action) => {
                state.positionScheduleLoading = false;
                if (!action.payload.fromCache) {
                    state.positionSchedule = action.payload.data;
                    state.positionScheduleLastFetched = Date.now();
                }
            })
            .addCase(fetchPositionScheduleAsAdmin.rejected, (state, action) => {
                state.positionScheduleLoading = false;
                state.positionScheduleError = action.payload;
            });
    },
});

export const { setCurrentEmployeeId, clearAllData } = adminEmployeeDataSlice.actions;

export default adminEmployeeDataSlice.reducer;