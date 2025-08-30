// frontend/src/features/admin-permanent-requests/model/adminRequestsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';
import { CACHE_DURATION, isCacheValid } from '../../../shared/lib/cache/cacheUtils';

export const fetchAllRequests = createAsyncThunk(
    'adminRequests/fetchAll',
    async (forceRefresh = false, { getState, rejectWithValue }) => {
        const state = getState();
        const { lastFetched, items } = state.adminRequests;

        if (!forceRefresh && isCacheValid(lastFetched, CACHE_DURATION.MEDIUM) && items.length > 0) {
            return { cached: true, data: items };
        }

        try {
            const response = await constraintAPI.getAllPermanentRequests();
            console.log('[fetchAllRequests] Response:', response);

            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && response.data) {
                data = response.data;
            }

            return { cached: false, data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load requests');
        }
    },
);

export const reviewRequest = createAsyncThunk(
    'adminRequests/review',
    async ({ requestId, status, adminResponse }, { rejectWithValue }) => {
        try {
            await constraintAPI.reviewRequest(requestId, { status, admin_response: adminResponse });
            return { requestId, status };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to review request');
        }
    },
);

const adminRequestsSlice = createSlice({
    name: 'adminRequests',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pendingCount: 0,
        lastFetched: null,
    },
    reducers: {
        updatePendingCount: (state) => {
            state.pendingCount = state.items.filter(r => r.status === 'pending').length;
        },
        invalidateCache(state) {
            state.lastFetched = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllRequests.fulfilled, (state, action) => {
                state.loading = false;
                if (!action.payload.cached) {
                    state.items = action.payload.data || [];
                    state.lastFetched = Date.now();
                } else {
                    state.items = action.payload.data || [];
                }
                state.pendingCount = state.items.filter(r => r.status === 'pending').length;
            })
            .addCase(fetchAllRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(reviewRequest.fulfilled, (state, action) => {
                const { requestId, status } = action.payload;
                const request = state.items.find(r => r.id === requestId);
                if (request) {
                    request.status = status;
                    request.reviewed_at = new Date().toISOString();
                }
                state.pendingCount = state.items.filter(r => r.status === 'pending').length;
                // Invalidate cache when data changes
                state.lastFetched = null;
            });
    },
});

export const { updatePendingCount, invalidateCache } = adminRequestsSlice.actions;
export default adminRequestsSlice.reducer;