// frontend/src/app/store/slices/positionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { positionAPI } from 'shared/api/apiService';

// --- Асинхронные Thunks ---

// Thunk для получения должностей по ID сайта
export const fetchPositions = createAsyncThunk(
    'positions/fetchPositions',
    async (siteId, { rejectWithValue }) => {
        try {
            const positions = await positionAPI.fetchPositions(siteId);
            return positions; // Interceptor уже извлек .data
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to fetch positions';
            return rejectWithValue(message);
        }
    }
);

// Thunk для обновления должности
export const updatePosition = createAsyncThunk(
    'positions/updatePosition',
    async (positionData, { rejectWithValue }) => {
        try {
            const updatedPosition = await positionAPI.updatePosition(positionData);
            return updatedPosition; // Ожидаем, что бэкенд вернет обновленный объект
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update position';
            return rejectWithValue(message);
        }
    }
);

// --- Начальное состояние ---
const initialState = {
    positions: [],
    loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
    error: null,
};

// --- Слайс ---
const positionSlice = createSlice({
    name: 'positions',
    initialState,
    reducers: {}, // Синхронные редьюсеры здесь не нужны
    extraReducers: (builder) => {
        builder
            // Обработка fetchPositions
            .addCase(fetchPositions.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchPositions.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.positions = action.payload; // Записываем полученный массив должностей
            })
            .addCase(fetchPositions.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Обработка updatePosition
            .addCase(updatePosition.pending, (state) => {
                state.loading = 'pending'; // Можно сделать более гранулярный лоадинг, но для начала так
            })
            .addCase(updatePosition.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                // Находим индекс обновленной должности в массиве
                const index = state.positions.findIndex(p => p.pos_id === action.payload.pos_id);
                // Если нашли, заменяем старый объект на новый
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