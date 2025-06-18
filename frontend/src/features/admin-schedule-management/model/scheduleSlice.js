// frontend/src/app/store/slices/scheduleSlice.js
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import { scheduleAPI, worksiteAPI, employeeAPI } from 'shared/api/apiService';

// --- Асинхронные экшены (Thunks) ---

// Получение списка всех расписаний
export const fetchSchedules = createAsyncThunk(
    'schedule/fetchSchedules',
    async (_, { rejectWithValue }) => {
        try {
            const response = await scheduleAPI.fetchSchedules();
            // Если используется структура с pagination
            if (response && response.items) {
                return response.items;
            }
            return response || [];
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
            console.log('Schedule details response:', response); // Для отладки

            return response; // Возвращаем только data
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
            return response; // Возвращаем только data
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
            return response; // Возвращаем только data
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
            return response; // Возвращаем только data
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
            return response;
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
            const response = await employeeAPI.fetchRecommendations(
                params.scheduleId,
                params.positionId,
                params.shiftId,
                params.date
            );
            return response; // Возвращаем только data
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
            const response = await worksiteAPI.fetchWorkSites();
            return response;
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
        workSites: [],
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
            .addCase(deleteSchedule.fulfilled, (state, action) => {
                state.loading = 'idle';
                // Удаляем расписание из списка
                state.schedules = state.schedules.filter(s => s.id !== action.payload);
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
                state.error = action.payload;
            })
            // Обработка updateScheduleStatus
            .addCase(updateScheduleStatus.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(updateScheduleStatus.fulfilled, (state, action) => {
                state.loading = 'idle';
                // Обновляем статус в списке расписаний
                const scheduleIndex = state.schedules.findIndex(s => s.id === action.meta.arg.scheduleId);
                if (scheduleIndex !== -1) {
                    state.schedules[scheduleIndex] = {
                        ...state.schedules[scheduleIndex],
                        status: action.meta.arg.status
                    };
                }
                // Обновляем в деталях, если это текущее расписание
                if (state.scheduleDetails?.schedule?.id === action.meta.arg.scheduleId) {
                    state.scheduleDetails.schedule.status = action.meta.arg.status;
                }
                state.error = null;
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