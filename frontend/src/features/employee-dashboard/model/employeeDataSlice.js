// frontend/src/features/employee-dashboard/model/employeeDataSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scheduleAPI, constraintAPI } from 'shared/api/apiService';
import { addNotification } from 'app/model/notificationsSlice';
import { parseISO, addWeeks, format } from 'date-fns';
import { CACHE_DURATION } from "../../../shared/lib/cache/cacheUtils";
// Cache duration in milliseconds
const CACHE_DURATION_SHORT = CACHE_DURATION.SHORT;
const CACHE_DURATION_LONG = CACHE_DURATION.LONG;


// Helper to check cache validity
const isCacheValid = (timestamp, duration) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
};
export const fetchPersonalSchedule = createAsyncThunk(
    'employeeData/fetchPersonalSchedule',
    async ({ forceRefresh = false }, { getState, rejectWithValue }) => {
        const { personalSchedule, personalScheduleLastFetched } = getState().employeeData;

        if (!forceRefresh && personalSchedule && isCacheValid(personalScheduleLastFetched)) {
            return { data: personalSchedule, fromCache: true };
        }

        try {
            const currentResponse = await scheduleAPI.fetchWeeklySchedule();
            const currentData = currentResponse.data || currentResponse;
            let nextData = null;

            if (currentData?.week?.start) {
                const nextWeekStart = format(addWeeks(parseISO(currentData.week.start), 1), 'yyyy-MM-dd');
                const nextResponse = await scheduleAPI.fetchWeeklySchedule(nextWeekStart);
                nextData = nextResponse.data || nextResponse;
            }
            return { data: { current: currentData, next: nextData }, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
// Async thunks
export const fetchEmployeeSchedule = createAsyncThunk(
    'employeeData/fetchSchedule',
    // КЕШ: 3. Добавляем forceRefresh и доступ к состоянию
    async ({ forceRefresh = false }, { getState, rejectWithValue }) => {
        const state = getState().employeeData;

        // КЕШ: 4. Проверяем кеш перед запросом
        if (!forceRefresh && state.schedule && isCacheValid(state.scheduleLastFetched, CACHE_DURATION_SHORT)) {
            return { data: state.schedule, fromCache: true };
        }

        try {
            // Используем правильный метод, как и раньше
            const response = await scheduleAPI.fetchWeeklySchedule();
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
export const fetchPositionSchedule = createAsyncThunk(
    'employeeData/fetchPositionSchedule',
    async ({ positionId, forceRefresh = false }, { getState, rejectWithValue }) => {
        const { positionSchedule, positionScheduleLastFetched } = getState().employeeData;

        if (!forceRefresh && positionSchedule && isCacheValid(positionScheduleLastFetched)) {
            return { data: positionSchedule, fromCache: true };
        }

        try {
            const currentResponse = await scheduleAPI.fetchPositionWeeklySchedule(positionId);
            const currentData = currentResponse;
            let nextData = null;
            console.log('[fetchPositionSchedule] Current data:', currentData, 'Current response: ', currentResponse);
            if (currentData?.week?.start) {
                const nextWeekStart = format(addWeeks(parseISO(currentData.week.start), 1), 'yyyy-MM-dd');
                nextData = await scheduleAPI.fetchPositionWeeklySchedule(positionId, nextWeekStart);
            }
            return { data: { current: currentData, next: nextData }, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
export const fetchEmployeeConstraints = createAsyncThunk(
    'employeeData/fetchConstraints', // Меняем имя для уникальности
    async ({ forceRefresh = false }, { getState, rejectWithValue }) => {
        const { constraints, constraintsLastFetched } = getState().employeeData;

        if (!forceRefresh && constraints && isCacheValid(constraintsLastFetched, CACHE_DURATION_LONG)) {
            return { data: constraints, fromCache: true };
        }

        try {
            const response = await constraintAPI.getWeeklyConstraints({});
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch constraints');
        }
    }
);

export const fetchEmployeeArchiveSummary = createAsyncThunk(
    'employeeData/fetchArchiveSummary',
    async (_, { getState, rejectWithValue }) => {
        const state = getState().employeeData;
        // Кешируем список месяцев, чтобы не запрашивать его каждый раз
        if (state.archiveSummary && isCacheValid(state.archiveSummaryLastFetched, CACHE_DURATION_LONG)) {
            return { data: state.archiveSummary, fromCache: true };
        }
        try {
            const response = await scheduleAPI.fetchEmployeeArchiveSummary();
            return { data: response.data || response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchEmployeeArchiveMonth = createAsyncThunk(
    'employeeData/fetchArchiveMonth',
    async ({ year, month }, { getState, rejectWithValue }) => {
        const state = getState().employeeData;
        const cacheKey = `${year}-${month}`;
        const cachedData = state.archiveCache[cacheKey];

        // Проверяем кеш для конкретного месяца
        if (cachedData && isCacheValid(cachedData.timestamp, CACHE_DURATION_LONG)) {
            return { data: cachedData.data, month, year, fromCache: true };
        }
        try {
            const response = await scheduleAPI.fetchEmployeeArchiveMonth(year, month);
            return { data: response.data || response, month, year, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Check for schedule updates
export const checkScheduleUpdates = createAsyncThunk(
    'employeeData/checkUpdates',
    async (_, { getState, dispatch }) => {
        try {
            // Используем personalSchedule, так как он содержит основные данные
            const currentScheduleData = getState().employeeData.personalSchedule?.current;

            if (!currentScheduleData?.schedule?.id) {
                // Если у нас еще нет данных о расписании, проверять нечего
                return null;
            }

            const scheduleId = currentScheduleData.schedule.id;
            const response = await scheduleAPI.fetchScheduleDetails(scheduleId);

            const newVersion = response?.schedule?.updatedAt;
            const oldVersion = currentScheduleData.schedule?.updatedAt;

            // Сравниваем только время последнего обновления, это самый надежный способ
            if (newVersion && oldVersion && newVersion !== oldVersion) {
                dispatch(addNotification({
                    id: 'schedule-update-notification',
                    message: 'schedule.hasUpdates',
                    variant: 'info',
                    action: {
                        label: 'common.refresh',

                        handler: () => {
                            dispatch(fetchPersonalSchedule({ forceRefresh: true }));

                            if (currentScheduleData?.employee?.position_id) {
                                dispatch(fetchPositionSchedule({
                                    positionId: currentScheduleData.employee.position_id,
                                    forceRefresh: true
                                }));
                            }
                        }
                    },
                    persistent: true
                }));

                return { hasUpdates: true };
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
        // --- Персональное расписание ---
        personalSchedule: null,
        personalScheduleLastFetched: null,
        personalScheduleLoading: false,
        personalScheduleError: null,

        // --- Расписание по должности ---
        positionSchedule: null,
        positionScheduleLastFetched: null,
        positionScheduleLoading: false,
        positionScheduleError: null,

        // Constraints data
        constraints: null,
        constraintsLastFetched: null,
        constraintsLoading: false,
        constraintsError: null,

        // Archive cache
        archiveSummary: null, // Для списка доступных месяцев
        archiveSummaryLastFetched: null,
        archiveSummaryLoading: false,
        archiveSummaryError: null,
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

            // Personal Schedule
            .addCase(fetchPersonalSchedule.pending, (state) => {
                state.personalScheduleLoading = true;
            })
            .addCase(fetchPersonalSchedule.fulfilled, (state, action) => {
                state.personalScheduleLoading = false;
                if (!action.payload.fromCache) {
                    state.personalSchedule = action.payload.data;
                    state.personalScheduleLastFetched = Date.now();
                }
            })
            .addCase(fetchPersonalSchedule.rejected, (state, action) => {
                state.personalScheduleLoading = false;
                state.personalScheduleError = action.payload;
            })
            // Position Schedule
            .addCase(fetchPositionSchedule.pending, (state) => {
                state.positionScheduleLoading = true;
            })
            .addCase(fetchPositionSchedule.fulfilled, (state, action) => {
                state.positionScheduleLoading = false;
                if (!action.payload.fromCache) {
                    state.positionSchedule = action.payload.data;
                    state.positionScheduleLastFetched = Date.now();
                }
            })
            .addCase(fetchPositionSchedule.rejected, (state, action) => {
                state.positionScheduleLoading = false;
                state.positionScheduleError = action.payload;
            })

            // Fetch constraints
            .addCase(fetchEmployeeConstraints.pending, (state) => {
                state.constraintsLoading = true;
                state.constraintsError = null;
            })
            .addCase(fetchEmployeeConstraints.fulfilled, (state, action) => {
                state.constraintsLoading = false;
                if (!action.payload.fromCache) {
                    state.constraints = action.payload.data; // Сохраняем данные сюда
                    state.constraintsLastFetched = Date.now();
                }
            })
            .addCase(fetchEmployeeConstraints.rejected, (state, action) => {
                state.constraintsLoading = false;
                state.constraintsError = action.payload;
            })

            // Fetch archive
            .addCase(fetchEmployeeArchiveSummary.pending, (state) => {
                state.archiveSummaryLoading = true;
            })
            .addCase(fetchEmployeeArchiveSummary.fulfilled, (state, action) => {
                state.archiveSummaryLoading = false;
                if (!action.payload.fromCache) {
                    state.archiveSummary = action.payload.data;
                    state.archiveSummaryLastFetched = Date.now();
                }
            })
            .addCase(fetchEmployeeArchiveSummary.rejected, (state, action) => {
                state.archiveSummaryLoading = false;
                state.archiveSummaryError = action.payload;
            })
            .addCase(fetchEmployeeArchiveMonth.pending, (state) => {
                state.archiveLoading = true;
            })
            .addCase(fetchEmployeeArchiveMonth.fulfilled, (state, action) => {
                state.archiveLoading = false;
                if (!action.payload.fromCache) {
                    const cacheKey = `${action.payload.year}-${action.payload.month}`;
                    state.archiveCache[cacheKey] = {
                        data: action.payload.data,
                        timestamp: Date.now()
                    };
                }
            })
            .addCase(fetchEmployeeArchiveMonth.rejected, (state, action) => {
                state.archiveLoading = false;
                state.archiveError = action.payload;
            })

            // Check updates
            .addCase(checkScheduleUpdates.fulfilled, (state, action) => {
                if (action.payload) {
                    state.hasUpdates = true;
                }
            });
    }
});
export const selectNewUpdatesCount = (state) => {
    const { items, lastViewedAt } = state.requests;
    if (!items || items.length === 0) return 0;

    if (!lastViewedAt) {
        return items.filter(r => r.status !== 'pending').length;
    }

    return items.filter(r =>
        r.status !== 'pending' &&
        r.reviewed_at &&
        new Date(r.reviewed_at) > new Date(lastViewedAt)
    ).length;
};
export const {
    clearAllCache,
    clearScheduleCache,
    clearConstraintsCache,
    setDashboardStats,
} = employeeDataSlice.actions;

export default employeeDataSlice.reducer;