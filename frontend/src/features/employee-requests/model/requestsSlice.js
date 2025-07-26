// frontend/src/features/employee-requests/model/requestsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

// Async thunks
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
        loading: false,
        loaded: false,
        error: null
    },
    reducers: {
        addNewRequest: (state, action) => {
            state.items.unshift(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch requests
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
            // Delete request
            .addCase(deleteRequest.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
            });
    }
});

export const { addNewRequest } = requestsSlice.actions;
export default requestsSlice.reducer;