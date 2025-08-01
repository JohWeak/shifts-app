// frontend/src/features/employee-requests/model/requestsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

export const fetchMyRequests = createAsyncThunk(
    'requests/fetchMy',
    async (_, { rejectWithValue }) => {
        try {
            const response = await constraintAPI.getMyPermanentRequests();
            return response.data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load requests');
        }
    }
);

export const fetchMyPermanentConstraints = createAsyncThunk(
    'requests/fetchMyPermanentConstraints',
    async (_, { rejectWithValue }) => {
        try {
            const response = await constraintAPI.getMyPermanentConstraints();
            return response.data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load permanent constraints');
        }
    }
);

export const deleteRequest = createAsyncThunk(
    'requests/delete',
    async (requestId, { rejectWithValue }) => {
        try {
            await constraintAPI.deletePermanentRequest(requestId);
            return requestId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete request');
        }
    }
);

const requestsSlice = createSlice({
    name: 'requests',
    initialState: {
        items: [],
        permanentConstraints: [],
        loading: false,
        loaded: false,
        error: null,
        loadingRequestId: null,
        lastViewedAt: localStorage.getItem('requests_last_viewed') || null
    },
    reducers: {
        addNewRequest: (state, action) => {
            state.items.unshift(action.payload);
        },
        updateRequest: (state, action) => {
            const { tempId, realRequest } = action.payload;
            const index = state.items.findIndex(item => item.id === tempId);
            if (index !== -1) {
                state.items[index] = realRequest;
            }
        },
        removeRequest: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
        },
        setRequestLoading: (state, action) => {
            state.loadingRequestId = action.payload;
        },
        markAsViewed: (state) => {
            const now = new Date().toISOString();
            state.lastViewedAt = now;
            localStorage.setItem('requests_last_viewed', now);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.items = action.payload;
            })
            .addCase(fetchMyRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteRequest.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
            })
            .addCase(fetchMyPermanentConstraints.pending, (state) => {
                console.log('[requestsSlice] Fetching permanent constraints...');
            })
            .addCase(fetchMyPermanentConstraints.fulfilled, (state, action) => {
                console.log('[requestsSlice] Permanent constraints loaded:', action.payload);
                state.permanentConstraints = action.payload;
            })
            .addCase(fetchMyPermanentConstraints.rejected, (state, action) => {
                console.error('[requestsSlice] Failed to load permanent constraints:', action.payload);
            });
    }
});
// Селектор для подсчета новых изменений
export const selectNewUpdatesCount = (state) => {
    const { items, lastViewedAt } = state.requests;
    if (!lastViewedAt) return items.filter(r => r.status !== 'pending').length;

    return items.filter(r =>
        r.status !== 'pending' &&
        r.reviewed_at &&
        new Date(r.reviewed_at) > new Date(lastViewedAt)
    ).length;
};
export const {
    addNewRequest,
    updateRequest,
    removeRequest,
    setRequestLoading,
    markAsViewed
} = requestsSlice.actions;

export default requestsSlice.reducer;