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
            const response = await scheduleAPI.fetchSchedules();
            // Если используется структура с pagination
            if (response.data && response.data.items) {
                return response.data.items;
            }
            return response.data || [];
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
            const response = await scheduleAPI.fetchScheduleDetails(scheduleId);
            console.log('Schedule details response:', response.data); // Для отладки

            return response.data; // Возвращаем только data
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Генерация нового расписания
export const generateSchedule = createAsyncThunk(
    'schedule/generateSchedule',
    async (settings, { rejectWithValue }) => {
        try {
            const response = await scheduleAPI.generateSchedule(settings);
            return response.data; // Возвращаем только data
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateScheduleStatus = createAsyncThunk(
    'schedule/updateScheduleStatus',
    async ({ scheduleId, status }, { rejectWithValue }) => {
        try {
            const response = await scheduleAPI.updateScheduleStatus(scheduleId, status);
            return response.data; // Возвращаем только data
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
            const response = await scheduleAPI.compareAlgorithms(settings);
            return response.data; // Возвращаем только data
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Удаление расписания
export const deleteSchedule = createAsyncThunk(
    'schedule/deleteSchedule',
    async (scheduleId, { rejectWithValue }) => {
        try {
            await scheduleAPI.deleteSchedule(scheduleId);
            return scheduleId; // Возвращаем ID для удаления из state
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Обновление назначений
export const updateScheduleAssignments = createAsyncThunk(
    'schedule/updateScheduleAssignments',
    async ({ scheduleId, changes }, { rejectWithValue }) => {
        try {
            const response = await scheduleAPI.updateScheduleAssignments(scheduleId, changes);
            return response.data; // Возвращаем только data
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Export schedule
export const exportSchedule = createAsyncThunk(
    'schedule/exportSchedule',
    async ({ scheduleId, format }, { rejectWithValue }) => {
        try {
            await scheduleAPI.exportSchedule(scheduleId, format);
            return { success: true }; // Возвращаем простой объект
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
            return response.data; // Возвращаем только data
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
            const response = await scheduleAPI.fetchWorkSites();
            return response.data; // Возвращаем только data
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
                state.error = null;
            })
            .addCase(fetchSchedules.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to fetch schedules';
            })

            // Обработка fetchScheduleDetails
            .addCase(fetchScheduleDetails.pending, (state) => {
                state.loading = 'pending';
                state.scheduleDetails = null;
                state.error = null;
            })
            .addCase(fetchScheduleDetails.fulfilled, (state, action) => {
                state.loading = 'idle';
                state.scheduleDetails = action.payload;
                state.selectedScheduleId = action.payload?.schedule?.id;
                state.activeTab = 'view';
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