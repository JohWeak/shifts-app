// frontend/src/features/employee-profile/model/profileSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { employeeAPI } from 'shared/api/apiService';

export const loadProfile = createAsyncThunk(
    'profile/load',
    async (_, { rejectWithValue }) => {
        try {
            const response = await employeeAPI.getProfile();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load profile');
        }
    },
);

export const updateProfile = createAsyncThunk(
    'profile/update',
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await employeeAPI.updateProfile(profileData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
        }
    },
);

const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        user: null,
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        clearMessages: (state) => {
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Load profile
            .addCase(loadProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loadProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update profile
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.success = true;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearMessages } = profileSlice.actions;
export default profileSlice.reducer;