// frontend/src/features/employee-dashboard/model/employeeDataSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scheduleAPI, constraintAPI } from 'shared/api/apiService';
import { addNotification } from 'app/model/notificationsSlice';

// Cache duration in milliseconds
const CACHE_DURATION = {
    SCHEDULE: 5 * 60 * 1000, // 5 minutes
    CONSTRAINTS: 10 * 60 * 1000, // 10 minutes
    ARCHIVE: 30 * 60 * 1000, // 30 minutes
};

// Helper to check cache validity
const isCacheValid = (timestamp, duration) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
};

// Async thunks
export const fetchEmployeeSchedule = createAsyncThunk(
    'employeeData/fetchSchedule',
    async ({ forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { schedule, scheduleLastFetched } = state.employeeData;

            // Check cache
            if (!forceRefresh && isCacheValid(scheduleLastFetched, CACHE_DURATION.SCHEDULE) && schedule) {
                return { data: schedule, fromCache: true };
            }

            // Используем правильный метод
            const response = await scheduleAPI.fetchWeeklySchedule();
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchEmployeeConstraints = createAsyncThunk(
    'employeeData/fetchConstraints',
    async ({ weekStart, forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { constraints, constraintsLastFetched } = state.employeeData;

            // Check cache
            if (!forceRefresh &&
                isCacheValid(constraintsLastFetched, CACHE_DURATION.CONSTRAINTS) &&
                constraints?.weekStart === weekStart) {
                return { data: constraints, fromCache: true };
            }
            const response = await constraintAPI.getWeeklyConstraints({ weekStart });

            console.log("ОТВЕТ ОТ API (Ограничения):", JSON.stringify(response, null, 2));

            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchEmployeeArchive = createAsyncThunk(
    'employeeData/fetchArchive',
    async ({ month, forceRefresh = false }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const archiveKey = `archive_${month}`;
            const cachedData = state.employeeData.archiveCache[archiveKey];

            // Check cache
            if (!forceRefresh && cachedData &&
                isCacheValid(cachedData.timestamp, CACHE_DURATION.ARCHIVE)) {
                return { data: cachedData.data, month, fromCache: true };
            }

            // Парсим месяц для API
            const [year, monthNum] = month.split('-');
            const response = await scheduleAPI.fetchEmployeeArchiveMonth(
                parseInt(year),
                parseInt(monthNum)
            );
            return { data: response.data || response, month, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Check for schedule updates - используем правильный метод
export const checkScheduleUpdates = createAsyncThunk(
    'employeeData/checkUpdates',
    async (_, { getState, dispatch }) => {
        try {
            const state = getState();
            const currentSchedule = state.employeeData.schedule;

            if (!currentSchedule?.schedule?.id) return null;

            // Get latest schedule details
            const response = await scheduleAPI.fetchScheduleDetails(currentSchedule.schedule.id);

            // Check if status or version changed
            const newStatus = response.schedule?.status;
            const newVersion = response.schedule?.updatedAt;
            const oldStatus = currentSchedule.schedule?.status;
            const oldVersion = currentSchedule.schedule?.updatedAt;

            if (newStatus !== oldStatus || newVersion !== oldVersion) {
                // Show notification
                dispatch(addNotification({
                    id: 'schedule-update',
                    message: 'schedule.hasUpdates',
                    variant: 'info',
                    action: {
                        label: 'common.refresh',
                        handler: () => dispatch(fetchEmployeeSchedule({ forceRefresh: true }))
                    },
                    persistent: true
                }));

                return { status: newStatus, version: newVersion };
            }

            return null;
        } catch (error) {
            console.error('Error checking schedule updates:', error);
            return null;
        }
    }
);

// Slice
const employeeDataSlice = createSlice({
    name: 'employeeData',
    initialState: {
        // Schedule data
        schedule: null,
        scheduleLastFetched: null,
        scheduleLoading: false,
        scheduleError: null,

        // Constraints data
        constraints: null,
        constraintsLastFetched: null,
        constraintsLoading: false,
        constraintsError: null,

        // Archive cache
        archiveCache: {}, // { 'archive_2024-01': { data, timestamp } }
        archiveLoading: false,
        archiveError: null,

        // Update checking
        lastUpdateCheck: null,
        hasUpdates: false,

        // Dashboard data
        dashboardStats: null,
        dashboardLastFetched: null,
    },
    reducers: {
        clearAllCache: (state) => {
            state.schedule = null;
            state.scheduleLastFetched = null;
            state.constraints = null;
            state.constraintsLastFetched = null;
            state.archiveCache = {};
            state.dashboardStats = null;
            state.dashboardLastFetched = null;
        },
        clearScheduleCache: (state) => {
            state.schedule = null;
            state.scheduleLastFetched = null;
            state.hasUpdates = false;
        },
        clearConstraintsCache: (state) => {
            state.constraints = null;
            state.constraintsLastFetched = null;
        },
        setDashboardStats: (state, action) => {
            state.dashboardStats = action.payload;
            state.dashboardLastFetched = Date.now();
        },

    },
    extraReducers: (builder) => {
        builder
            // Fetch schedule
            .addCase(fetchEmployeeSchedule.pending, (state) => {
                state.scheduleLoading = true;
                state.scheduleError = null;
            })
            .addCase(fetchEmployeeSchedule.fulfilled, (state, action) => {
                state.scheduleLoading = false;
                if (!action.payload.fromCache) {
                    state.schedule = action.payload.data;
                    state.scheduleLastFetched = Date.now();
                }
                state.hasUpdates = false;
            })
            .addCase(fetchEmployeeSchedule.rejected, (state, action) => {
                state.scheduleLoading = false;
                state.scheduleError = action.payload;
            })

            // Fetch constraints
            .addCase(fetchEmployeeConstraints.pending, (state) => {
                state.constraintsLoading = true;
                state.constraintsError = null;
            })
            .addCase(fetchEmployeeConstraints.fulfilled, (state, action) => {
                state.constraintsLoading = false;
                if (!action.payload.fromCache) {
                    state.constraints = action.payload.data;
                    state.constraintsLastFetched = Date.now();
                }
            })
            .addCase(fetchEmployeeConstraints.rejected, (state, action) => {
                state.constraintsLoading = false;
                state.constraintsError = action.payload;
            })

            // Fetch archive
            .addCase(fetchEmployeeArchive.pending, (state) => {
                state.archiveLoading = true;
                state.archiveError = null;
            })
            .addCase(fetchEmployeeArchive.fulfilled, (state, action) => {
                state.archiveLoading = false;
                if (!action.payload.fromCache) {
                    const archiveKey = `archive_${action.payload.month}`;
                    state.archiveCache[archiveKey] = {
                        data: action.payload.data,
                        timestamp: Date.now()
                    };
                }
            })
            .addCase(fetchEmployeeArchive.rejected, (state, action) => {
                state.archiveLoading = false;
                state.archiveError = action.payload;
            })

            // Check updates
            .addCase(checkScheduleUpdates.fulfilled, (state, action) => {
                state.lastUpdateCheck = Date.now();
                if (action.payload) {
                    state.hasUpdates = true;
                }
            });
    }
});

export const {
    clearAllCache,
    clearScheduleCache,
    clearConstraintsCache,
    setDashboardStats,
} = employeeDataSlice.actions;

export default employeeDataSlice.reducer;