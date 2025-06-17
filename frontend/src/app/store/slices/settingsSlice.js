import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsAPI } from '../../../shared/api/apiService';

// Async thunks
export const fetchSystemSettings = createAsyncThunk(
    'settings/fetchSystemSettings',
    async (_, { rejectWithValue }) => {
        try {
            const response = await settingsAPI.fetchSystemSettings();
            return response;
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
            minRestBetweenShifts: 8, // hours
        },
        loading: 'idle',
        error: null,
    },
    reducers: {
        updateLocalSettings(state, action) {
            state.systemSettings = { ...state.systemSettings, ...action.payload };
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
                state.systemSettings = action.payload;
            })
            .addCase(fetchSystemSettings.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.payload;
            })
            // Update settings
            .addCase(updateSystemSettings.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(updateSystemSettings.fulfilled, (state, action) => {
                state.loading = 'idle';
                state.systemSettings = action.payload;
            })
            .addCase(updateSystemSettings.rejected, (state, action) => {
                state.loading = 'idle';
                state.error = action.payload;
            });
    },
});

export const { updateLocalSettings } = settingsSlice.actions;
export default settingsSlice.reducer;