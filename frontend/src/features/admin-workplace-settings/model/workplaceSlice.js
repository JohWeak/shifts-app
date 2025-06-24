// frontend/src/features/admin-workplace-settings/model/workplaceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from 'shared/api';
import { API_ENDPOINTS } from 'shared/config/apiEndpoints';

// Async thunks
export const fetchWorkSites = createAsyncThunk(
    'workplace/fetchWorkSites',
    async ({ includeStats = true } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(API_ENDPOINTS.WORKSITES.BASE, {
                params: { includeStats }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch work sites');
        }
    }
);

export const createWorkSite = createAsyncThunk(
    'workplace/createWorkSite',
    async (siteData, { rejectWithValue }) => {
        try {
            const response = await api.post(API_ENDPOINTS.WORKSITES.BASE, siteData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create work site');
        }
    }
);

export const updateWorkSite = createAsyncThunk(
    'workplace/updateWorkSite',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`${API_ENDPOINTS.WORKSITES.BASE}/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update work site');
        }
    }
);

export const deleteWorkSite = createAsyncThunk(
    'workplace/deleteWorkSite',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`${API_ENDPOINTS.WORKSITES.BASE}/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete work site');
        }
    }
);

// Slice
const workplaceSlice = createSlice({
    name: 'workplace',
    initialState: {
        workSites: [],
        positions: [],
        loading: false,
        error: null,
        operationStatus: null // 'success' | 'error' | null
    },
    reducers: {
        clearOperationStatus: (state) => {
            state.operationStatus = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch work sites
        builder
            .addCase(fetchWorkSites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkSites.fulfilled, (state, action) => {
                state.loading = false;
                state.workSites = action.payload;
            })
            .addCase(fetchWorkSites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create work site
            .addCase(createWorkSite.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWorkSite.fulfilled, (state, action) => {
                state.loading = false;
                state.workSites.push(action.payload);
                state.operationStatus = 'success';
            })
            .addCase(createWorkSite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.operationStatus = 'error';
            })
            // Update work site
            .addCase(updateWorkSite.fulfilled, (state, action) => {
                const index = state.workSites.findIndex(site => site.site_id === action.payload.site_id);
                if (index !== -1) {
                    state.workSites[index] = action.payload;
                }
                state.operationStatus = 'success';
            })
            // Delete work site
            .addCase(deleteWorkSite.fulfilled, (state, action) => {
                state.workSites = state.workSites.filter(site => site.site_id !== action.payload);
                state.operationStatus = 'success';
            })
            .addCase(deleteWorkSite.rejected, (state, action) => {
                state.error = action.payload;
                state.operationStatus = 'error';
            });
    }
});

export const { clearOperationStatus } = workplaceSlice.actions;
export default workplaceSlice.reducer;