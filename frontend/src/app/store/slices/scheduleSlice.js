// frontend/src/app/store/slices/scheduleSlice.js
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import * as scheduleAPI from '../../../shared/api/scheduleAPI';
import * as worksiteAPI from '../../../shared/api/worksiteAPI';

// --- Асинхронные экшены (Thunks) ---

// Получение списка всех расписаний
export const fetchSchedules = createAsyncThunk(
    'schedule/fetchSchedules',
    async (_, { rejectWithValue }) => {
        try {
            return await scheduleAPI.fetchSchedules();
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
            return await scheduleAPI.fetchScheduleDetails(scheduleId);
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

export const updateScheduleStatus = createAsyncThunk(
    'schedule/updateStatus',
    async ({ scheduleId, status }, { rejectWithValue }) => {
        try {
            // Вызываем функцию из нашего API-слоя
            const data = await scheduleAPI.updateScheduleStatus(scheduleId, status);
            return data.data; // Возвращаем обновленное расписание
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
            return await scheduleAPI.compareAlgorithms(settings);
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
    async (params, { rejectWithValue }) => {
        try {
            const response = await scheduleAPI.getRecommendations(
                params.scheduleId,
                params.positionId,
                params.shiftId,
                params.date
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Загрузка рабочих мест
export const fetchWorkSites = createAsyncThunk(
    'schedule/fetchWorkSites',
    async (_, { rejectWithValue }) => {
        try {
            return await worksiteAPI.fetchWorkSites(); // <-- ИЗМЕНИТЬ
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// --- Слайс (Slice) ---


const scheduleSlice = createSlice({
    name: 'schedule',
    initialState: {
        // Данные
        schedules: [],
        scheduleDetails: null,
        workSites: [], // <-- ИСПРАВЛЕНО
        recommendations: { available: [], cross_position: [], unavailable_busy: [], unavailable_hard: [], unavailable_soft: [] },

        // Состояния загрузки
        loading: 'idle', // для основных операций
        workSitesLoading: 'idle',
        recommendationsLoading: 'idle',

        // Ошибки
        error: null,

        // UI Состояния
        selectedScheduleId: null,
        activeTab: 'overview',
        editingPositions: {},
        pendingChanges: {},
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
                state.error = null;
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
                state.error = null;
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
                state.error = null;
            })
            .addCase(generateSchedule.fulfilled, (state, action) => {
                // Диспатч fetchSchedules уже сделан внутри thunk,
                // здесь мы просто сбрасываем состояние загрузки
                state.loading = 'succeeded';
            })
            .addCase(generateSchedule.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;

            })

            .addCase(compareAlgorithms.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(compareAlgorithms.fulfilled, (state, action) => {
                state.loading = 'succeeded'; // Сбрасываем загрузку
                // ...
            })
            .addCase(compareAlgorithms.rejected, (state, action) => {
                state.loading = 'failed'; // Сбрасываем загрузку
                state.error = action.payload;
            })

            .addCase(deleteSchedule.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(updateScheduleAssignments.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })

            .addCase(fetchRecommendations.pending, (state) => {
                state.recommendationsLoading = 'pending';
                state.error = null;
            })
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                state.recommendationsLoading = 'succeeded';
                state.recommendations = action.payload;
            })
            .addCase(fetchRecommendations.rejected, (state, action) => {
                state.recommendationsLoading = 'failed';
                state.error = action.payload; // Можно использовать общий error или отдельный
            })
            // Обработка fetchWorkSites
            .addCase(fetchWorkSites.pending, (state) => {
                state.workSitesLoading = 'pending';
            })
            .addCase(fetchWorkSites.fulfilled, (state, action) => {
                state.workSitesLoading = 'succeeded';
                state.workSites = action.payload;
            })
            .addCase(fetchWorkSites.rejected, (state, action) => {
                state.workSitesLoading = 'failed';
                state.error = action.payload; // Можно добавить отдельное поле workSitesError
            })
            // Обработка updateScheduleStatus
            .addCase(updateScheduleStatus.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(updateScheduleStatus.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                const updatedSchedule = action.payload;

                // Обновляем расписание в общем списке
                state.schedules = state.schedules.map(schedule =>
                    schedule.id === updatedSchedule.id ? updatedSchedule : schedule
                );

                // Если это расписание открыто в детальном просмотре, обновляем и его
                if (state.scheduleDetails?.schedule.id === updatedSchedule.id) {
                    state.scheduleDetails.schedule = updatedSchedule;
                }
            })
            .addCase(updateScheduleStatus.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
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