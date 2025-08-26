//frontend/src/features/admin-system-settings/model/settingsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsAPI } from 'shared/api/apiService';
import {CACHE_DURATION, isCacheValid} from "../../../shared/lib/cache/cacheUtils";

// Async thunks
export const fetchSystemSettings = createAsyncThunk(
    'settings/fetchSystemSettings',
    async (forceRefresh = false, { getState, rejectWithValue }) => {
        const state = getState();
        const { lastFetched, systemSettings } = state.settings;

        // Проверяем кэш
        if (!forceRefresh && isCacheValid(lastFetched, CACHE_DURATION.LONG) && systemSettings?.positions?.length > 0) {
            return { cached: true, data: systemSettings };
        }

        try {
            const response = await settingsAPI.fetchSystemSettings();
            return { cached: false, data: response };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateSystemSettings = createAsyncThunk(
    'settings/updateSystemSettings',
    async (settings, { rejectWithValue }) => {
        try {
            const response = await settingsAPI.updateSystemSettings(settings);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
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
            defaultEmployeesPerShift: 1,
            algorithmMaxTime: 120,
            strictLegalCompliance: true,
            positions: [], // Добавляем массив позиций
            workSites: [],

            // Position-specific settings (можно переопределить для каждой позиции)
            positionSettings: {},// hours
        },
        loading: 'idle',
        error: null,
        lastFetched: null,
    },
    reducers: {
        updateLocalSettings(state, action) {
            state.systemSettings = { ...state.systemSettings, ...action.payload };
        },
        invalidateCache(state) {
            state.lastFetched = null;
        }
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
                    state.systemSettings = {
                        ...state.systemSettings,
                        ...action.payload.data
                    };
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
            .addCase(updateSystemSettings.fulfilled, (state, action) => {
                state.loading = 'idle';
                state.systemSettings = {
                    ...state.systemSettings,
                    ...action.payload
                };
            })
            .addCase(updateSystemSettings.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.payload || 'Failed to update settings';
            });
    },
});

export default settingsSlice.reducer;