// frontend/src/app/store/slices/scheduleSlice.js
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {scheduleAPI} from "shared/api/apiService"
import {employeeAPI}  from 'shared/api/apiService';
import {worksiteAPI}  from 'shared/api/apiService';

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
    async (settings, { dispatch, rejectWithValue, getState }) => {
        try {
            const data = await scheduleAPI.generateSchedule(settings);

            // Get current state to determine navigation logic
            const state = getState();
            const currentTab = state.schedule.activeTab;
            const currentScheduleId = state.schedule.selectedScheduleId;

            // After successful generation, update schedules list
            await dispatch(fetchSchedules());

            return {
                ...data,
                shouldNavigate: currentTab === 'view' && currentScheduleId,
                wasOnOverview: currentTab === 'overview'
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateScheduleStatus = createAsyncThunk(
    'schedule/updateStatus',
    async ({ scheduleId, status }, { rejectWithValue }) => {
        try {
            const data = await scheduleAPI.updateScheduleStatus(scheduleId, status);
            return data.data;
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
            return response;
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
            return { ...result, format };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchRecommendations = createAsyncThunk(
    'schedule/fetchRecommendations',
    async (params, { rejectWithValue }) => {
        try {
            return await employeeAPI.fetchRecommendations(
                params.scheduleId,
                params.positionId,
                params.shiftId,
                params.date
            );
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
        recommendations: {
            available: [],
            cross_position: [],
            unavailable_busy: [],
            unavailable_hard: [],
            unavailable_soft: []
        },

        // Состояния загрузки
        loading: 'idle',
        workSitesLoading: 'idle',
        recommendationsLoading: 'idle',

        // Ошибки
        error: null,

        // UI Состояния
        selectedScheduleId: null,
        activeTab: 'overview',
        editingPositions: {},
        pendingChanges: {},

        // Новые поля для отслеживания созданного расписания
        newlyCreatedScheduleId: null,
        shouldNavigateToNew: false,
        showNewScheduleHighlight: false,
    },
    reducers: {
        // Синхронные экшены для управления UI
        setActiveTab(state, action) {
            state.activeTab = action.payload;
        },
        setSelectedScheduleId(state, action) {
            state.selectedScheduleId = action.payload;
            state.scheduleDetails = null;
            state.activeTab = action.payload ? 'view' : 'overview';
        },

        // Новые экшены для управления навигацией после генерации
        clearNewScheduleFlags(state) {
            state.newlyCreatedScheduleId = null;
            state.shouldNavigateToNew = false;
            state.showNewScheduleHighlight = false;
        },

        setNewScheduleHighlight(state, action) {
            state.showNewScheduleHighlight = action.payload;
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
            // Не сбрасываем флаги нового расписания здесь
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
                state.editingPositions = {};
                state.pendingChanges = {};
            })
            .addCase(fetchScheduleDetails.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Обработка generateSchedule
            .addCase(generateSchedule.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(generateSchedule.fulfilled, (state, action) => {
                state.loading = 'succeeded';

                // Extract schedule ID from response
                const newScheduleId = action.payload.data?.schedule_id || action.payload.data?.id;

                if (newScheduleId) {
                    state.newlyCreatedScheduleId = newScheduleId;
                    state.shouldNavigateToNew = action.payload.shouldNavigate;
                    state.showNewScheduleHighlight = action.payload.wasOnOverview;
                }
            })
            .addCase(generateSchedule.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Обработка сравнения алгоритмов
            .addCase(compareAlgorithms.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(compareAlgorithms.fulfilled, (state, action) => {
                state.loading = 'succeeded';
            })
            .addCase(compareAlgorithms.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            // Обработка удаления расписания
            .addCase(deleteSchedule.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })

            // Обработка обновления назначений
            .addCase(updateScheduleAssignments.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })

            // Обработка рекомендаций
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
                state.error = action.payload;
            })

            // Обработка worksites
            .addCase(fetchWorkSites.pending, (state) => {
                state.workSitesLoading = 'pending';
                state.error = null;
            })
            .addCase(fetchWorkSites.fulfilled, (state, action) => {
                state.workSitesLoading = 'succeeded';
                state.workSites = action.payload;
            })
            .addCase(fetchWorkSites.rejected, (state, action) => {
                state.workSitesLoading = 'failed';
                state.error = action.payload;
            });
    },
});

export const {
    setActiveTab,
    setSelectedScheduleId,
    toggleEditPosition,
    addPendingChange,
    removePendingChange,
    clearPositionChanges,
    resetScheduleView,
    clearNewScheduleFlags,
    setNewScheduleHighlight
} = scheduleSlice.actions;

export default scheduleSlice.reducer;