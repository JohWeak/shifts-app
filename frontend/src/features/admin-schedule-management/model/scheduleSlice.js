// frontend/src/app/store/slices/scheduleSlice.js
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {employeeAPI, scheduleAPI, worksiteAPI} from 'shared/api/apiService';
import {CACHE_DURATION, isCacheValid} from "../../../shared/lib/cache/cacheUtils";

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
    async (settings, { dispatch, rejectWithValue }) => {
        try {
            const response = await scheduleAPI.generateSchedule(settings);

            // After successful generation, fetch the details of the new schedule
            if (response?.schedule_id) {
                // Fetch updated list first
                await dispatch(fetchSchedules());
                // Then fetch details of the new schedule
                dispatch(fetchScheduleDetails(response.schedule_id));
            }

            return response;
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
    async ({ scheduleId, changes }, { dispatch, rejectWithValue }) => {
        try {
            const response = await scheduleAPI.updateScheduleAssignments(scheduleId, changes);

            // После успешного обновления перезагружаем детали расписания
            await dispatch(fetchScheduleDetails(scheduleId));

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



// Загрузка рабочих мест
export const fetchWorkSites = createAsyncThunk(
    'schedule/fetchWorkSites',
    async (forceRefresh = false, { getState, rejectWithValue }) => {
        const state = getState();
        const { workSitesLastFetched, workSites } = state.schedule;

        // Проверяем кэш
        if (!forceRefresh && isCacheValid(workSitesLastFetched, CACHE_DURATION.LONG) && workSites?.length > 0) {
            return { cached: true, data: workSites };
        }

        try {
            const response = await worksiteAPI.fetchWorkSites();
            return { cached: false, data: response };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


export const fetchRecommendations = createAsyncThunk(
    'schedule/fetchRecommendations',
    async ({ positionId, shiftId, date, scheduleId }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const pendingChanges = state.schedule.pendingChanges;

            const virtualChanges = Object.values(pendingChanges || {}).map(change => ({
                action: change.action,
                emp_id: change.empId,
                position_id: change.positionId,
                shift_id: change.shiftId,
                date: change.date
            }));

            console.log('fetchRecommendations thunk: calling API');

            const response = await employeeAPI.fetchRecommendations(
                scheduleId,
                positionId,
                shiftId,
                date,
                virtualChanges.length > 0 ? virtualChanges : null
            );

            console.log('fetchRecommendations thunk: API response:', response);
            console.log('fetchRecommendations thunk: returning data:', response.data);

            return response;
        } catch (error) {
            console.error('fetchRecommendations thunk error:', error);
            return rejectWithValue(error.response?.message || 'Failed to fetch recommendations');
        }
    }
);


const scheduleSlice = createSlice({
    name: 'schedule',
    initialState: {
        schedules: [],
        scheduleDetails: null,
        workSites: [],
        recommendations: {
            available: [],
            cross_position: [],
            other_site: [],
            unavailable_busy: [],
            unavailable_hard: [],
            unavailable_soft: [],
            unavailable_permanent: []
        },
        autofilledChanges: {},


        loading: 'idle',
        workSitesLoading: 'idle',
        recommendationsLoading: 'idle',

        error: null,

        // UI Состояния
        selectedScheduleId: null,
        activeTab: 'overview',
        editingPositions: {},
        pendingChanges: {},
        workSitesLastFetched: null,

    },
    reducers: {
        updateShiftColor: (state, action) => {
            const { shiftId, color } = action.payload;

            if (state.scheduleDetails?.shifts) {
                const shiftIndex = state.scheduleDetails.shifts.findIndex(s => s.shift_id === shiftId);
                if (shiftIndex !== -1) {
                    state.scheduleDetails.shifts[shiftIndex].color = color;
                }
            }
            if (state.scheduleDetails?.positions) {
                state.scheduleDetails.positions.forEach(position => {
                    if (position.shifts?.find(s => s.shift_id === shiftId)) {
                        position.shifts.find(s => s.shift_id === shiftId).color = color;
                    }
                });
            }
        },
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

            // Track if this was an autofilled change
            if (change.isAutofilled) {
                state.autofilledChanges[key] = true;
            }

            console.log('Added pending change:', key, change);
            console.log('All pending changes:', state.pendingChanges);
        },
        addBatchPendingChanges(state, action) {
            const changes = action.payload;
            changes.forEach(({ key, change }) => {
                state.pendingChanges[key] = change;
                if (change.isAutofilled) {
                    state.autofilledChanges[key] = true;
                }
            });
            console.log(`Added ${changes.length} pending changes in batch`);
        },
        // Optimized save - just clear pending and mark as saved
        applyPendingChanges(state, action) {
            const positionId = action.payload;

            // Mark position as no longer editing
            state.editingPositions[positionId] = false;

            // Clear pending changes for this position but keep the assignments
            Object.keys(state.pendingChanges).forEach(key => {
                if (state.pendingChanges[key].positionId === positionId) {
                    // Mark autofilled as saved
                    if (state.pendingChanges[key].isAutofilled) {
                        state.pendingChanges[key].isSaved = true;
                    }
                    // Don't delete, just mark as applied
                    state.pendingChanges[key].isApplied = true;
                }
            });
        },
        removePendingChange(state, action) {
            const key = action.payload;
            delete state.pendingChanges[key];
            delete state.autofilledChanges[key];
            console.log('Removed pending change:', key);
            console.log('Remaining pending changes:', state.pendingChanges);
        },
        clearPositionChanges(state, action) {
            const positionId = action.payload;
            Object.keys(state.pendingChanges).forEach(key => {
                if (state.pendingChanges[key].positionId === positionId) {
                    delete state.pendingChanges[key];
                }
            });
        },
        clearAutofilledStatus(state, action) {
            const keys = action.payload;
            if (keys && Array.isArray(keys)) {
                keys.forEach(key => {
                    // Remove green dashed border but keep cross-position/site info
                    if (state.pendingChanges[key]) {
                        state.pendingChanges[key].isAutofilled = false;
                        state.pendingChanges[key].isSaved = true;
                    }
                    delete state.autofilledChanges[key];
                });
            } else {
                // Clear all autofilled status
                state.autofilledChanges = {};
                Object.keys(state.pendingChanges).forEach(key => {
                    if (state.pendingChanges[key]?.isAutofilled) {
                        state.pendingChanges[key].isAutofilled = false;
                        state.pendingChanges[key].isSaved = true;
                    }
                });
            }
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
                state.loading = 'idle';
                // Set the selected schedule ID and switch to view tab
                if (action.payload?.schedule_id) {
                    state.selectedScheduleId = action.payload.schedule_id;
                    state.activeTab = 'view';
                    // Details will be loaded by fetchScheduleDetails dispatched in the thunk
                }
                state.error = null;
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
            .addCase(updateScheduleAssignments.fulfilled, (state, action) => {
                state.loading = 'succeeded';

                // После успешного обновления данные будут перезагружены через fetchScheduleDetails
                // Очищаем pendingChanges для позиции, которая была сохранена
                if (action.meta?.arg?.changes) {
                    const positionId = action.meta.arg.changes[0]?.positionId;
                    if (positionId) {
                        // Удаляем все изменения для этой позиции
                        Object.keys(state.pendingChanges).forEach(key => {
                            if (state.pendingChanges[key].positionId === positionId) {
                                delete state.pendingChanges[key];
                            }
                        });

                        // Выключаем режим редактирования для этой позиции
                        state.editingPositions[positionId] = false;
                    }
                }
            })

            .addCase(fetchRecommendations.pending, (state) => {
                console.log('fetchRecommendations.pending');
                state.recommendationsLoading = 'pending';
                state.error = null;
            })
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                console.log('fetchRecommendations.fulfilled, payload:', action.payload);
                state.recommendationsLoading = 'succeeded';
                state.recommendations = action.payload;
                state.error = null;
            })
            .addCase(fetchRecommendations.rejected, (state, action) => {
                console.log('fetchRecommendations.rejected, error:', action.payload);
                state.recommendationsLoading = 'failed';
                state.error = action.payload;
            })

            // Обработка fetchWorkSites
            .addCase(fetchWorkSites.pending, (state) => {
                state.workSitesLoading = 'pending';
            })
            .addCase(fetchWorkSites.fulfilled, (state, action) => {
                state.workSitesLoading = 'idle';
                if (!action.payload.cached) {
                    state.workSites = action.payload.data;
                    state.workSitesLastFetched = Date.now();
                }
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
            })

    },
});

export const {
    setActiveTab,
    setSelectedScheduleId,
    resetScheduleView,
    toggleEditPosition,
    addPendingChange,
    removePendingChange,
    clearPositionChanges,
    updateShiftColor,
    clearAutofilledStatus,
    addBatchPendingChanges,
    applyPendingChanges
} = scheduleSlice.actions;

export default scheduleSlice.reducer;