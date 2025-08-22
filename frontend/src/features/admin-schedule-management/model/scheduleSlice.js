// frontend/src/app/store/slices/scheduleSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { employeeAPI, scheduleAPI, worksiteAPI } from 'shared/api/apiService';
import {
    CACHE_DURATION,
    isCacheValid,
    isCacheEntryValid,
    getCacheEntry,
    setCacheEntry,
    clearCacheEntry
} from 'shared/lib/cache/cacheUtils';
import { classifySchedules } from 'shared/lib/utils/scheduleUtils';



// Fetch work sites with unified cache
export const fetchWorkSites = createAsyncThunk(
    'schedule/fetchWorkSites',
    async (forceRefresh = false, { getState, rejectWithValue }) => {
        const state = getState();
        const { cache, cacheDurations } = state.schedule;

        // Check cache
        if (!forceRefresh && isCacheEntryValid(cache.workSites, cacheDurations.workSites)) {
            console.log('[Cache] Using cached work sites');
            return { cached: true, data: cache.workSites.data };
        }

        try {
            console.log('[Cache] Fetching fresh work sites');
            const response = await worksiteAPI.fetchWorkSites();
            return { cached: false, data: response };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSchedules = createAsyncThunk(
    'schedule/fetchSchedules',
    async (_, { rejectWithValue }) => {
        try {
            const response = await scheduleAPI.fetchSchedules();
            if (response && response.items) {
                return response.items;
            }
            return response || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Fetch schedule details with cache
export const fetchScheduleDetails = createAsyncThunk(
    'schedule/fetchScheduleDetails',
    async (scheduleId, { getState, rejectWithValue }) => {
        const state = getState();
        const { cache, cacheDurations } = state.schedule;
        const cached = getCacheEntry(cache.scheduleDetails, scheduleId);

        // Check cache
        if (cached && isCacheEntryValid(cached, cacheDurations.scheduleDetails)) {
            console.log(`[Cache] Using cached details for schedule ${scheduleId}`);
            return { cached: true, scheduleId, data: cached.data };
        }

        try {
            console.log(`[Cache] Fetching fresh details for schedule ${scheduleId}`);
            const details = await scheduleAPI.fetchScheduleDetails(scheduleId);
            return { cached: false, scheduleId, data: details };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


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


// export const fetchRecommendations = createAsyncThunk(
//     'schedule/fetchRecommendations',
//     async ({ positionId, shiftId, date, scheduleId }, { getState, rejectWithValue }) => {
//         try {
//             const state = getState();
//             const pendingChanges = state.schedule.pendingChanges;
//
//             const virtualChanges = Object.values(pendingChanges || {}).map(change => ({
//                 action: change.action,
//                 emp_id: change.empId,
//                 position_id: change.positionId,
//                 shift_id: change.shiftId,
//                 date: change.date
//             }));
//
//             console.log('fetchRecommendations thunk: calling API');
//
//             const response = await employeeAPI.fetchRecommendations(
//                 scheduleId,
//                 positionId,
//                 shiftId,
//                 date,
//                 virtualChanges.length > 0 ? virtualChanges : null
//             );
//
//             console.log('fetchRecommendations thunk: API response:', response);
//             console.log('fetchRecommendations thunk: returning data:', response.data);
//
//             return response;
//         } catch (error) {
//             console.error('fetchRecommendations thunk error:', error);
//             return rejectWithValue(error.response?.message || 'Failed to fetch recommendations');
//         }
//     }
// );

// Fetch recommendations with unified cache
export const fetchRecommendations = createAsyncThunk(
    'schedule/fetchRecommendations',
    async ({ positionId, shiftId, date, scheduleId }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const { pendingChanges, cache, cacheDurations } = state.schedule;

            // Create cache key based on parameters
            const cacheKey = `${scheduleId}_${positionId}_${shiftId}_${date}`;
            const cached = getCacheEntry(cache.recommendations, cacheKey);

            // Don't use cache if there are pending changes
            const hasPendingChanges = Object.keys(pendingChanges).length > 0;

            if (!hasPendingChanges && cached && isCacheEntryValid(cached, cacheDurations.recommendations)) {
                console.log(`[Cache] Using cached recommendations for ${cacheKey}`);
                return { cached: true, cacheKey, data: cached.data };
            }

            const virtualChanges = Object.values(pendingChanges || {}).map(change => ({
                action: change.action,
                emp_id: change.empId,
                position_id: change.positionId,
                shift_id: change.shiftId,
                date: change.date
            }));

            console.log(`[Cache] Fetching fresh recommendations for ${cacheKey}`);
            const response = await employeeAPI.fetchRecommendations(
                scheduleId,
                positionId,
                shiftId,
                date,
                virtualChanges.length > 0 ? virtualChanges : null
            );

            return { cached: false, cacheKey, data: response };
        } catch (error) {
            return rejectWithValue(error.response?.message || 'Failed to fetch recommendations');
        }
    }
);


// Preload with cache
export const preloadScheduleDetails = createAsyncThunk(
    'schedule/preloadScheduleDetails',
    async (_, { getState, dispatch }) => {
        const state = getState();
        const { schedules, cache, cacheDurations } = state.schedule;

        const { activeSchedules } = classifySchedules(schedules);
        console.log(`[Cache] Preloading details for ${activeSchedules.length} active schedules`);

        const batchSize = 3;
        let loadedCount = 0;

        for (let i = 0; i < activeSchedules.length; i += batchSize) {
            const batch = activeSchedules.slice(i, i + batchSize);

            const batchPromises = batch.map(async (schedule) => {
                const cached = getCacheEntry(cache.scheduleDetails, schedule.id);

                if (!cached || !isCacheEntryValid(cached, cacheDurations.scheduleDetails)) {
                    try {
                        await dispatch(fetchScheduleDetails(schedule.id));
                        loadedCount++;
                        return true;
                    } catch (error) {
                        console.error(`[Cache] Failed to preload schedule ${schedule.id}:`, error);
                        return false;
                    }
                }
                return false;
            });

            await Promise.all(batchPromises);
        }

        console.log(`[Cache] Preloaded ${loadedCount} schedule details`);
        return { loaded: loadedCount };
    }
);


const scheduleSlice = createSlice({
    name: 'schedule',
    initialState: {
        // Data
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

        // Loading states
        loading: 'idle',
        workSitesLoading: 'idle',
        recommendationsLoading: 'idle',

        // Errors
        error: null,

        // UI States
        selectedScheduleId: null,
        editingPositions: {},
        pendingChanges: {},

        cache: {
            workSites: null, // { data: [], timestamp: Date.now() }
            scheduleDetails: {}, // { [scheduleId]: { data: details, timestamp: Date.now() } }
            recommendations: {} // { [cacheKey]: { data: recommendations, timestamp: Date.now() } }
        },

        // Cache durations for different data types
        cacheDurations: {
            workSites: CACHE_DURATION.EXTRA_LONG,
            scheduleDetails: CACHE_DURATION.LONG,
            recommendations: CACHE_DURATION.SHORT
        }

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

        setSelectedScheduleId(state, action) {
            state.selectedScheduleId = action.payload;
            state.scheduleDetails = null;
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
            state.editingPositions = {};
            state.pendingChanges = {};
        },

        clearCache(state, action) {
            const { type, key } = action.payload || {};

            if (type === 'workSites') {
                state.cache.workSites = null;
            } else if (type === 'scheduleDetails') {
                if (key) {
                    clearCacheEntry(state.cache.scheduleDetails, key);
                } else {
                    state.cache.scheduleDetails = {};
                }
            } else if (type === 'recommendations') {
                if (key) {
                    clearCacheEntry(state.cache.recommendations, key);
                } else {
                    state.cache.recommendations = {};
                }
            } else {
                // Clear all caches
                state.cache = {
                    workSites: null,
                    scheduleDetails: {},
                    recommendations: {}
                };
            }
        },
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
                //state.scheduleDetails = null;
                if (!state.scheduleDetails) {
                    state.error = null;
                }
            })
            .addCase(fetchScheduleDetails.fulfilled, (state, action) => {
                state.loading = 'idle';
                if (state.selectedScheduleId === action.payload.scheduleId) {
                    state.scheduleDetails = action.payload.data;
                }
                // Update cache only if fresh data
                if (!action.payload.cached) {
                    setCacheEntry(state.cache.scheduleDetails, action.payload.scheduleId, action.payload.data);
                }
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
                if (action.payload?.schedule_id) {
                    state.selectedScheduleId = action.payload.schedule_id;

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
                state.loading = 'succeeded';

            })
            .addCase(compareAlgorithms.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            .addCase(deleteSchedule.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(deleteSchedule.fulfilled, (state, action) => {
                const scheduleId = action.payload;
                clearCacheEntry(state.cache.scheduleDetails, scheduleId);
                state.schedules = state.schedules.filter(s => s.id !== scheduleId);
            })

            .addCase(updateScheduleAssignments.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(updateScheduleAssignments.fulfilled, (state, action) => {
                const { newEmployees = [] } = action.payload;
                const { changes } = action.meta.arg;
                const positionId = changes[0]?.positionId;

                if (!positionId || !state.scheduleDetails) return;

                // Add new cross-site employees to the employees list
                if (newEmployees.length > 0) {
                    const existingIds = new Set(state.scheduleDetails.employees.map(e => e.emp_id));
                    newEmployees.forEach(emp => {
                        if (!existingIds.has(emp.emp_id)) {
                            state.scheduleDetails.employees.push(emp);
                        }
                    });
                }

                // Apply changes locally
                changes.forEach(change => {
                    if (change.action === 'assign') {
                        // Find employee data
                        const employee = state.scheduleDetails.employees.find(e => e.emp_id === change.empId);

                        // Check if assignment already exists
                        const existingIndex = state.scheduleDetails.assignments.findIndex(
                            a => a.emp_id === change.empId &&
                                a.position_id === change.positionId &&
                                a.shift_id === change.shiftId &&
                                a.work_date === change.date
                        );

                        if (existingIndex === -1) {
                            // Add new assignment
                            state.scheduleDetails.assignments.push({
                                emp_id: change.empId,
                                position_id: change.positionId,
                                shift_id: change.shiftId,
                                work_date: change.date,
                                employee: employee || {
                                    emp_id: change.empId,
                                    first_name: change.empName?.split(' ')[0] || '',
                                    last_name: change.empName?.split(' ').slice(1).join(' ') || ''
                                },
                                isCrossPosition: change.isCrossPosition,
                                isCrossSite: change.isCrossSite,
                                isFlexible: change.isFlexible
                            });
                        }
                    } else if (change.action === 'remove') {
                        // Remove assignment
                        state.scheduleDetails.assignments = state.scheduleDetails.assignments.filter(
                            a => !(
                                a.emp_id === change.empId &&
                                a.position_id === change.positionId &&
                                a.shift_id === change.shiftId &&
                                a.work_date === change.date
                            )
                        );
                    }
                });

                // Clear pending changes for this position
                Object.keys(state.pendingChanges).forEach(key => {
                    if (state.pendingChanges[key].positionId === positionId) {
                        delete state.pendingChanges[key];
                    }
                });
                state.cache.recommendations = {};
                // Clear details cache for this schedule
                if (state.selectedScheduleId) {
                    clearCacheEntry(state.cache.scheduleDetails, state.selectedScheduleId);
                }
                // Exit edit mode
                state.editingPositions[positionId] = false;

                // Update position stats
                const position = state.scheduleDetails.positions.find(p => p.pos_id === positionId);
                if (position) {
                    position.current_assignments = state.scheduleDetails.assignments.filter(
                        a => a.position_id === positionId
                    ).length;
                }
            })
            .addCase(updateScheduleAssignments.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload;
            })

            .addCase(fetchRecommendations.pending, (state) => {
                console.log('fetchRecommendations.pending');
                state.recommendationsLoading = 'pending';
                state.error = null;
            })
            // .addCase(fetchRecommendations.fulfilled, (state, action) => {
            //     console.log('fetchRecommendations.fulfilled, payload:', action.payload);
            //     state.recommendationsLoading = 'succeeded';
            //     state.recommendations = action.payload;
            //     state.error = null;
            // })
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                state.recommendationsLoading = 'idle';
                state.recommendations = action.payload.data;

                // Update cache only if fresh data
                if (!action.payload.cached) {
                    setCacheEntry(state.cache.recommendations, action.payload.cacheKey, action.payload.data);
                }
            })
            .addCase(fetchRecommendations.rejected, (state, action) => {
                console.log('fetchRecommendations.rejected, error:', action.payload);
                state.recommendationsLoading = 'failed';
                state.error = action.payload;
            })

            .addCase(fetchWorkSites.pending, (state) => {
                state.workSitesLoading = 'pending';
            })
            .addCase(fetchWorkSites.fulfilled, (state, action) => {
                state.workSitesLoading = 'idle';
                state.workSites = action.payload.data;

                if (!action.payload.cached) {
                    setCacheEntry(state.cache, 'workSites', action.payload.data);
                }
            })
            .addCase(fetchWorkSites.rejected, (state, action) => {
                state.workSitesLoading = 'failed';
                state.error = action.payload;
            })
            // updateScheduleStatus
            .addCase(updateScheduleStatus.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(updateScheduleStatus.fulfilled, (state, action) => {
                state.loading = 'idle';
                const { scheduleId, status } = action.meta.arg;


                clearCacheEntry(state.cache.scheduleDetails, scheduleId);
                const scheduleIndex = state.schedules.findIndex(s => s.id === scheduleId);
                if (scheduleIndex !== -1) {
                    state.schedules[scheduleIndex] = {
                        ...state.schedules[scheduleIndex],
                        status: status
                    };
                }
                if (state.scheduleDetails?.schedule?.id === scheduleId) {
                    state.scheduleDetails.schedule.status = status;
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
    setSelectedScheduleId,
    resetScheduleView,
    toggleEditPosition,
    addPendingChange,
    removePendingChange,
    clearPositionChanges,
    updateShiftColor,
    clearAutofilledStatus,
    addBatchPendingChanges,
    applyPendingChanges,
    clearCache
} = scheduleSlice.actions;

export default scheduleSlice.reducer;