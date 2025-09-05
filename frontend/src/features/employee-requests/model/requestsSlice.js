// frontend/src/features/employee-requests/model/requestsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
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
    },
);

export const fetchMyPermanentConstraints = createAsyncThunk(
    'requests/fetchMyPermanentConstraints',
    async (_, { rejectWithValue }) => {
        try {
            console.log('[fetchMyPermanentConstraints] Fetching...');
            const data = await constraintAPI.getMyPermanentConstraints();
            console.log('[fetchMyPermanentConstraints] Response data:', data);

            // data уже содержит массив constraints
            return data || [];
        } catch (error) {
            console.error('[fetchMyPermanentConstraints] Error:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to load permanent constraints');
        }
    },
);

export const deleteRequest = createAsyncThunk(
    'requests/delete',
    async ({ requestId, employeeId }, { rejectWithValue }) => {
        try {
            await constraintAPI.deletePermanentRequest(requestId, employeeId);
            return requestId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete request');
        }
    },
);

// Admin thunks for viewing specific employee data
export const fetchEmployeeRequestsAsAdmin = createAsyncThunk(
    'requests/fetchEmployeeRequestsAsAdmin',
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await constraintAPI.getEmployeePermanentRequests(employeeId);
            return response.data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load employee requests');
        }
    },
);

export const fetchEmployeePermanentConstraintsAsAdmin = createAsyncThunk(
    'requests/fetchEmployeePermanentConstraintsAsAdmin',
    async (employeeId, { rejectWithValue }) => {
        try {
            const data = await constraintAPI.getEmployeePermanentConstraints(employeeId);
            return data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load employee permanent constraints');
        }
    },
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
        lastViewedAt: localStorage.getItem('requests_last_viewed') || null,
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
        },
        clearRequestsData: (state) => {
            state.items = [];
            state.permanentConstraints = [];
            state.loading = false;
            state.loaded = false;
            state.error = null;
            state.loadingRequestId = null;
        },
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
            .addCase(fetchMyPermanentConstraints.pending, () => {
                console.log('[requestsSlice] Fetching permanent constraints...');
            })
            .addCase(fetchMyPermanentConstraints.fulfilled, (state, action) => {
                console.log('[requestsSlice] Setting permanent constraints:', action.payload);
                state.permanentConstraints = action.payload;
            })
            .addCase(fetchMyPermanentConstraints.rejected, (state, action) => {
                console.error('[requestsSlice] Failed to load permanent constraints:', action.payload);
            })

            // Admin thunks - reuse existing state fields
            .addCase(fetchEmployeeRequestsAsAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployeeRequestsAsAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.items = action.payload;
            })
            .addCase(fetchEmployeeRequestsAsAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchEmployeePermanentConstraintsAsAdmin.pending, () => {
                console.log('[requestsSlice] Fetching employee permanent constraints...');
            })
            .addCase(fetchEmployeePermanentConstraintsAsAdmin.fulfilled, (state, action) => {
                console.log('[requestsSlice] Setting employee permanent constraints:', action.payload);
                state.permanentConstraints = action.payload;
            })
            .addCase(fetchEmployeePermanentConstraintsAsAdmin.rejected, (state, action) => {
                console.error('[requestsSlice] Failed to load employee permanent constraints:', action.payload);
            });
    },
});
// Селектор для подсчета новых изменений
export const selectNewUpdatesCount = (state) => {
    const { items, lastViewedAt } = state.requests;
    if (!lastViewedAt) return items.filter(r => r.status !== 'pending').length;

    return items.filter(r =>
        r.status !== 'pending' &&
        r.reviewed_at &&
        new Date(r.reviewed_at) > new Date(lastViewedAt),
    ).length;
};
export const {
    addNewRequest,
    updateRequest,
    removeRequest,
    setRequestLoading,
    markAsViewed,
    clearRequestsData,
} = requestsSlice.actions;

export default requestsSlice.reducer;