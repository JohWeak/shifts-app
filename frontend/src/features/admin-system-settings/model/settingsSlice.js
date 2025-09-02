//frontend/src/features/admin-system-settings/model/settingsSlice.js

import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {settingsAPI} from 'shared/api/apiService';
import {CACHE_DURATION, isCacheValid} from '../../../shared/lib/cache/cacheUtils';

// Async thunks
export const fetchSystemSettings = createAsyncThunk(
    'settings/fetchSystemSettings',
    async ({siteId = null, forceRefresh = false} = {}, {getState, rejectWithValue}) => {
        const state = getState();
        const {lastFetched, systemSettings, currentSiteId} = state.settings;
        if (!forceRefresh && isCacheValid(lastFetched, CACHE_DURATION.LONG) && 
            systemSettings && currentSiteId === siteId) {
            return {cached: true, data: systemSettings, siteId};
        }
        try {
            const response = await settingsAPI.fetchSystemSettings(siteId);
            return {cached: false, data: response, siteId};
        } catch (error) {
            return rejectWithValue(error.message);
        }
    },
);

export const updateSystemSettings = createAsyncThunk(
    'settings/updateSystemSettings',
    async ({settings, siteId = null}, {rejectWithValue, dispatch}) => {
        try {
            const response = await settingsAPI.updateSystemSettings(settings, siteId);
            // Оптимистично обновляем локальное состояние
            dispatch(updateLocalSettings(settings));
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    },
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        systemSettings: {
            weekStartDay: 0, // 0 = Sunday, 1 = Monday
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            language: 'en',
            enableNotifications: true,
            autoPublishSchedule: false,
            defaultScheduleDuration: 7, // days
            minRestBetweenShifts: 8,
            // Constraint settings
            maxCannotWorkDays: 2,
            maxPreferWorkDays: 5,
            constraintDeadlineDay: 3, // Wednesday by default
            constraintDeadlineTime: '18:00',
            defaultEmployeesPerShift: 1,
            algorithmMaxTime: 120,
            strictLegalCompliance: true,
            positions: [],
            workSites: [],

            // Position-specific settings
            positionSettings: {},// hours
        },
        currentSiteId: null,
        loading: 'idle',
        error: null,
        lastFetched: null,
    },
    reducers: {
        updateLocalSettings(state, action) {
            state.systemSettings = {...state.systemSettings, ...action.payload};
        },
        setCurrentSite(state, action) {
            state.currentSiteId = action.payload;
        },
        invalidateCache(state) {
            state.lastFetched = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch settings
            .addCase(fetchSystemSettings.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(fetchSystemSettings.fulfilled, (state, action) => {
                state.loading = 'idle';
                if (!action.payload.cached) {
                    const responseData = action.payload.data?.data || action.payload.data;
                    state.systemSettings = {
                        ...state.systemSettings,
                        ...responseData,
                    };
                    state.currentSiteId = action.payload.siteId;
                    state.lastFetched = Date.now();
                }
            })
            .addCase(fetchSystemSettings.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.payload || 'Failed to fetch settings';
            })
            // Update settings
            .addCase(updateSystemSettings.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(updateSystemSettings.fulfilled, (state) => {
                state.loading = 'idle';
                state.error = null;
            })
            .addCase(updateSystemSettings.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.payload || 'Failed to update settings';
            });
    },
});

export const {updateLocalSettings, setCurrentSite, invalidateCache} = settingsSlice.actions;
export default settingsSlice.reducer;