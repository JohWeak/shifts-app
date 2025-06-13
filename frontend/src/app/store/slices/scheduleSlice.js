// frontend/src/app/store/slices/scheduleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as scheduleAPI from '../../../shared/api/scheduleAPI';
import * as employeeAPI from '../../../shared/api/employeeAPI';
import axios from "axios";

// --- Асинхронные экшены (Thunks) ---

// Получение списка всех расписаний
export const fetchSchedules = createAsyncThunk(
    'schedule/fetchSchedules',
    async (_, { rejectWithValue }) => {
        try {
            const data = await scheduleAPI.fetchSchedules();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Получение деталей конкретного расписания
export const fetchScheduleDetails = createAsyncThunk(
    'schedule/fetchScheduleDetails',
    async (scheduleId, { rejectWithValue }) => {
        try {
            const data = await scheduleAPI.fetchScheduleDetails(scheduleId);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Генерация нового расписания
export const generateSchedule = createAsyncThunk(
    'schedule/generateSchedule',
    async (settings, { dispatch, rejectWithValue }) => {
        try {
            const data = await scheduleAPI.generateSchedule(settings);
            // После успешной генерации, автоматически обновляем список расписаний
            dispatch(fetchSchedules());
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Сравнение алгоритмов
export const compareAlgorithms = createAsyncThunk(
    'schedule/compareAlgorithms',
    async (settings, { rejectWithValue }) => {
        try {
            const data = await scheduleAPI.compareAlgorithms(settings);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Удаление расписания
export const deleteSchedule = createAsyncThunk(
    'schedule/deleteSchedule',
    async (scheduleId, { dispatch, rejectWithValue }) => {
        try {
            const response = await scheduleAPI.deleteSchedule(scheduleId);
            // После успешного удаления обновляем список
            dispatch(fetchSchedules());
            return response; // Возвращаем ответ сервера
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Обновление назначений
export const updateScheduleAssignments = createAsyncThunk(
    'schedule/updateAssignments',
    async ({ scheduleId, changes }, { dispatch, rejectWithValue }) => {
        try {
            const result = await scheduleAPI.updateScheduleAssignments(scheduleId, changes);
            // После сохранения перезагружаем детали, чтобы увидеть актуальное состояние
            dispatch(fetchScheduleDetails(scheduleId));
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
export const exportSchedule = createAsyncThunk(
    'schedule/exportSchedule',
    async ({ scheduleId, format }, { rejectWithValue }) => {
        try {
            const result = await scheduleAPI.exportSchedule(scheduleId, format);
            return { ...result, format }; // Возвращаем имя файла и формат для уведомления
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchRecommendations = createAsyncThunk(
    'schedule/fetchRecommendations',
    async ({ positionId, shiftId, date, scheduleId }, { rejectWithValue }) => {
        try {
            // Здесь будет вызов API-функции
            // Для примера, пока что оставим заглушку
            const response = await axios.get('http://localhost:5000/api/employees/recommendations', {
                params: { position_id: positionId, shift_id: shiftId, date, schedule_id: scheduleId },
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

// --- Слайс (Slice) ---

const initialState = {
    // Данные
    schedules: [],
    scheduleDetails: null,

    // Состояния
    loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
    error: null,

    // UI Состояния (можно оставить в локальном стейте компонентов, но для примера перенесем)
    selectedScheduleId: null,
    activeTab: 'overview',

    recommendations: { available: [], cross_position: [], unavailable_busy: [], unavailable_hard: [], unavailable_soft: [] },
    recommendationsLoading: 'idle',
};

const scheduleSlice = createSlice({
    name: 'schedule',
    initialState: {
        schedules: [],
        scheduleDetails: null,
        loading: 'idle',
        error: null,
        selectedScheduleId: null,
        activeTab: 'overview',

        //  поля для управления редактированием
        editingPositions: {}, // { [pos_id]: boolean }
        pendingChanges: {}, // { [changeKey]: changeObject }
    },
    reducers: {
        // Синхронные экшены для управления UI
        setActiveTab(state, action) {
            state.activeTab = action.payload;
        },
        setSelectedScheduleId(state, action) {
            state.selectedScheduleId = action.payload;
            state.scheduleDetails = null; // Сбрасываем детали при выборе нового расписания
            state.activeTab = action.payload ? 'view' : 'overview';
        },
        // Синхронные экшены для управления редактированием
        toggleEditPosition(state, action) {
            const positionId = action.payload;
            const isCurrentlyEditing = !!state.editingPositions[positionId];
            state.editingPositions[positionId] = !isCurrentlyEditing;

            // Если мы перестаем редактировать, очищаем несохраненные изменения для этой позиции
            if (isCurrentlyEditing) {
                Object.keys(state.pendingChanges).forEach(key => {
                    if (state.pendingChanges[key].positionId === positionId) {
                        delete state.pendingChanges[key];
                    }
                });
            }
        },
        addPendingChange(state, action) {
            const { key, change } = action.payload;
            state.pendingChanges[key] = change;
        },
        removePendingChange(state, action) {
            const key = action.payload;
            delete state.pendingChanges[key];
        },
        clearPositionChanges(state, action) {
            const positionId = action.payload;
            Object.keys(state.pendingChanges).forEach(key => {
                if (state.pendingChanges[key].positionId === positionId) {
                    delete state.pendingChanges[key];
                }
            });
        },
        // сброс при выходе из детального просмотра
        resetScheduleView(state) {
            state.selectedScheduleId = null;
            state.scheduleDetails = null;
            state.activeTab = 'overview';
            state.editingPositions = {};
            state.pendingChanges = {};
        }
    },
    extraReducers: (builder) => {
        builder
            // Обработка fetchSchedules
            .addCase(fetchSchedules.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(fetchSchedules.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.schedules = action.payload;
            })
            .addCase(fetchSchedules.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Обработка fetchScheduleDetails
            .addCase(fetchScheduleDetails.pending, (state) => {
                state.loading = 'pending';
                state.scheduleDetails = null;
            })
            .addCase(fetchScheduleDetails.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.scheduleDetails = action.payload;
                state.selectedScheduleId = action.payload.schedule.id;
                state.activeTab = 'view';
                state.editingPositions = {}; // Сброс при загрузке новых деталей
                state.pendingChanges = {}; // Сброс при загрузке новых деталей
            })
            .addCase(fetchScheduleDetails.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Обработка generateSchedule (только pending/rejected, fulfilled handled by thunk)
            .addCase(generateSchedule.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(generateSchedule.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;

            })

            .addCase(fetchRecommendations.pending, (state) => {
                state.recommendationsLoading = 'pending';
            })
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                state.recommendationsLoading = 'succeeded';
                state.recommendations = action.payload;
            })
            .addCase(fetchRecommendations.rejected, (state, action) => {
                state.recommendationsLoading = 'failed';
                state.error = action.payload; // Можно использовать общий error или отдельный
            });


    },
});

export const {
    setActiveTab,
    setSelectedScheduleId,
    resetScheduleView,
    toggleEditPosition,
    addPendingChange,
    removePendingChange,
    clearPositionChanges
} = scheduleSlice.actions;

export default scheduleSlice.reducer;