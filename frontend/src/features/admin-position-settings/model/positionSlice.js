// frontend/src/app/store/slices/positionSlice.js
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {positionAPI} from 'shared/api/apiService';


export const fetchPositions = createAsyncThunk(
    'positions/fetchPositions',
    async (siteId, {rejectWithValue}) => {
        try {
            return await positionAPI.fetchPositions(siteId);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to fetch positions';
            return rejectWithValue(message);
        }
    }
);

export const updatePosition = createAsyncThunk(
    'positions/updatePosition',
    async (positionData, {rejectWithValue}) => {
        try {
            return await positionAPI.updatePosition(positionData);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update position';
            return rejectWithValue(message);
        }
    }
);

const initialState = {
    positions: [],
    loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
    error: null,
};

const positionSlice = createSlice({
    name: 'positions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPositions.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchPositions.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.positions = action.payload;
            })
            .addCase(fetchPositions.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            .addCase(updatePosition.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(updatePosition.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                const index = state.positions.findIndex(p => p.pos_id === action.payload.pos_id);
                if (index !== -1) {
                    state.positions[index] = action.payload;
                }
            })
            .addCase(updatePosition.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            });
    },
});

export default positionSlice.reducer;