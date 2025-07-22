// frontend/src/features/employee-constraints/model/constraintSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

const CACHE_DURATION = 5 * 60 * 1000;
const isCacheValid = (timestamp) => {
    if (!timestamp) return false;
    return (Date.now() - timestamp) < CACHE_DURATION;
};

// Async thunks
export const fetchWeeklyConstraints = createAsyncThunk(
    'constraints/fetchWeeklyConstraints',
    // КЕШ: 3. Принимаем forceRefresh и получаем доступ к состоянию через thunkAPI
    async ({ weekStart, forceRefresh = false }, { getState, rejectWithValue }) => {
        const state = getState().constraints; // Получаем текущее состояние этого слайса

        // КЕШ: 4. Проверяем валидность кеша перед выполнением запроса
        if (!forceRefresh && state.weeklyTemplate && isCacheValid(state.lastFetched)) {
            // Если кеш валиден, возвращаем данные из него и помечаем, что это из кеша
            return { data: state.weeklyTemplate, fromCache: true };
        }

        try {
            const response = await constraintAPI.getWeeklyConstraints({ weekStart });
            // Помечаем, что данные пришли из API
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch');
        }
    }
);

export const submitWeeklyConstraints = createAsyncThunk(
    'constraints/submitWeeklyConstraints',
    async (constraintsData, { rejectWithValue }) => {
        try {
            const response = await constraintAPI.submitWeeklyConstraints(constraintsData);
            return response;
        } catch (error) {
            return rejectWithValue(error.error.message || 'Submit failed');
        }
    }
);

export const fetchPermanentRequests = createAsyncThunk(
    'constraints/fetchPermanentRequests',
    async (empId, { rejectWithValue }) => {
        try {
            const response = await constraintAPI.getPermanentRequests(empId);
            return response;
        } catch(error) {
            return rejectWithValue(error.error.message || 'Failed to fetch permanent requests');
        }
    }
);

const constraintSlice = createSlice({
    name: 'constraints',
    initialState: {
        // Weekly constraints data
        weeklyTemplate: null,
        weeklyConstraints: {},
        weekStart: null,

        // Permanent requests
        permanentRequests: [],

        // UI states
        loading: false,
        submitting: false,
        error: null,
        submitStatus: null,
        limitError: '',

        // Settings
        currentMode: 'cannot_work', // 'cannot_work' | 'prefer_work'
        isSubmitted: false,
        canEdit: true,
        lastFetched: null,
    },
    reducers: {
        setCurrentMode: (state, action) => {
            state.currentMode = action.payload;
        },
        updateConstraint: (state, action) => {
            const { date, shiftId, status } = action.payload;

            if (!state.weeklyConstraints[date]) {
                state.weeklyConstraints[date] = { day_status: 'neutral', shifts: {} };
            }

            if (shiftId) {
                // Сценарий 1: Клик по конкретной смене
                state.weeklyConstraints[date].shifts[shiftId] = status;

                // Проверяем, нарушает ли это изменение "статус всего дня".
                // Если да, сбрасываем статус дня в нейтральный.
                const allShiftsSame = Object.values(state.weeklyConstraints[date].shifts)
                    .every(s => s === status);
                if (!allShiftsSame) {
                    state.weeklyConstraints[date].day_status = 'neutral';
                }

            } else {
                // Сценарий 2: Клик по заголовку дня (shiftId is null)
                state.weeklyConstraints[date].day_status = status;

                // ЯВНО обновляем статус для КАЖДОЙ смены в этот день.
                // Это ключевое исправление.
                if (state.weeklyTemplate) {
                    const dayTemplate = state.weeklyTemplate.constraints.template.find(d => d.date === date);
                    if (dayTemplate && dayTemplate.shifts) {
                        dayTemplate.shifts.forEach(shift => {
                            // Используем shift.shift_id для доступа к правильному ключу
                            state.weeklyConstraints[date].shifts[shift.shift_id] = status;
                        });
                    }
                }
            }
        },
        clearSubmitStatus: (state) => {
            state.submitStatus = null;
        },

        resetConstraints: (state) => {
            const initialConstraints = {};
            if (state.weeklyTemplate) {
                state.weeklyTemplate.constraints.template.forEach(day => {
                    initialConstraints[day.date] = { day_status: 'neutral', shifts: {} };
                    day.shifts.forEach(shift => {
                        initialConstraints[day.date].shifts[shift.shift_id] = 'neutral';
                    });
                });
            }
            state.weeklyConstraints = initialConstraints;
            state.isSubmitted = false; // Allow re-submitting after clearing
        },

        enableEditing: (state) => {
            state.isSubmitted = false;
            state.canEdit = true;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch weekly constraints
            .addCase(fetchWeeklyConstraints.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWeeklyConstraints.fulfilled, (state, action) => {
                state.loading = false;

                // КЕШ: 6. Обновляем состояние, ТОЛЬКО если данные пришли не из кеша
                if (!action.payload.fromCache) {
                    const templateData = action.payload.data;
                    state.weeklyTemplate = templateData;
                    state.isSubmitted = templateData.constraints.already_submitted;
                    state.canEdit = templateData.constraints.can_edit;

                    const initialConstraints = {};
                    templateData.constraints.template.forEach(day => {
                        initialConstraints[day.date] = { day_status: 'neutral', shifts: {} };
                        let firstStatus = null;
                        let allSame = true;

                        day.shifts.forEach((shift, index) => {
                            const status = shift.status || 'neutral';
                            initialConstraints[day.date].shifts[shift.shift_id] = status;
                            if (index === 0) firstStatus = status;
                            else if (status !== firstStatus) allSame = false;
                        });

                        if (allSame && firstStatus !== 'neutral') {
                            initialConstraints[day.date].day_status = firstStatus;
                        }
                    });
                    state.weeklyConstraints = initialConstraints;

                    // КЕШ: 7. Обновляем метку времени
                    state.lastFetched = Date.now();
                }
            })
            .addCase(fetchWeeklyConstraints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // Используем payload для ошибки из rejectWithValue
            })


            // Submit constraints
            .addCase(submitWeeklyConstraints.pending, (state) => {
                state.submitting = true;
                state.submitStatus = 'pending';
                state.error = null;
            })
            .addCase(submitWeeklyConstraints.fulfilled, (state) => {
                state.submitting = false;
                state.submitStatus = 'success';
                state.isSubmitted = true;
                state.canEdit = false;
            })
            .addCase(submitWeeklyConstraints.rejected, (state, action) => {
                state.submitting = false;
                state.submitStatus = 'error';
                state.error = action.error.message;
            });
    }
});

export const {
    setCurrentMode,
    updateConstraint,
    clearSubmitStatus,
    resetConstraints,
    enableEditing
} = constraintSlice.actions;

export default constraintSlice.reducer;