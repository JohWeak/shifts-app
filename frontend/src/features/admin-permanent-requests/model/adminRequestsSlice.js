// frontend/src/features/admin-permanent-requests/model/adminRequestsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

export const fetchAllRequests = createAsyncThunk(
    'adminRequests/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await constraintAPI.getAllPermanentRequests();
            return response.data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load requests');
        }
    }
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
    }
);

const adminRequestsSlice = createSlice({
    name: 'adminRequests',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pendingCount: 0
    },
    reducers: {
        updatePendingCount: (state) => {
            state.pendingCount = state.items.filter(r => r.status === 'pending').length;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.pendingCount = action.payload.filter(r => r.status === 'pending').length;
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
            });
    }
});

export const { updatePendingCount } = adminRequestsSlice.actions;
export default adminRequestsSlice.reducer;