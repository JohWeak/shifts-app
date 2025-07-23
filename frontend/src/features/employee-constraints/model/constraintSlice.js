// frontend/src/features/employee-constraints/model/constraintSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { constraintAPI } from 'shared/api/apiService';

const CACHE_DURATION = 10 * 60 * 1000; // 10 минут

const isCacheValid = (timestamp) => {
    if (!timestamp) return false;
    return (Date.now() - timestamp) < CACHE_DURATION;
};

export const fetchWeeklyConstraints = createAsyncThunk(
    'constraints/fetchWeekly', // Уникальное имя
    async ({ forceRefresh = false } = {}, { getState, rejectWithValue }) => {
        const state = getState().constraints;
        if (!forceRefresh && state.weeklyTemplate && isCacheValid(state.lastFetched)) {
            return { data: state.weeklyTemplate, fromCache: true };
        }
        try {
            const response = await constraintAPI.getWeeklyConstraints({});
            return { data: response, fromCache: false };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunks
export const submitWeeklyConstraints = createAsyncThunk(
    'constraints/submitWeeklyConstraints',
    async (constraintsData) => {
        const response = await constraintAPI.submitWeeklyConstraints(constraintsData);
        return response;
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
        weeklyTemplate: null, // Шаблон с сервера
        weeklyConstraints: {}, // Редактируемая копия
        loading: false,
        error: null,
        lastFetched: null,

        // Permanent requests
        permanentRequests: [],

        // UI states
        submitting: false,
        submitStatus: null,
        limitError: '',
        submitError: null,

        // Settings
        currentMode: 'cannot_work', // 'cannot_work' | 'prefer_work'
        isSubmitted: false,
        canEdit: true,
        originalConstraintsOnEdit: null,
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
            state.originalConstraintsOnEdit = JSON.parse(JSON.stringify(state.weeklyConstraints));
        },
        cancelEditing: (state) => {
            // Если снимок существует, восстанавливаем из него данные
            if (state.originalConstraintsOnEdit) {
                state.weeklyConstraints = state.originalConstraintsOnEdit;
            }
            // Возвращаем UI в состояние "до редактирования"
            state.isSubmitted = true;
            state.canEdit = false; // или true, в зависимости от того, хотите ли вы сразу снова разрешить редактирование
            state.originalConstraintsOnEdit = null; // Очищаем снимок
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWeeklyConstraints.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWeeklyConstraints.fulfilled, (state, action) => {
                state.loading = false;
                if (!action.payload.fromCache) {
                    const templateData = action.payload.data;
                    state.weeklyTemplate = templateData;
                    state.isSubmitted = templateData.constraints.already_submitted;
                    state.canEdit = templateData.constraints.can_edit;
                    state.lastFetched = Date.now();

                    // --- Вот исправление для "пустой таблицы" ---
                    const initialConstraints = {};
                    templateData.constraints.template.forEach(day => {
                        initialConstraints[day.date] = { day_status: 'neutral', shifts: {} };
                        let allSame = true, firstStatus = null;
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
                }
            })
            .addCase(fetchWeeklyConstraints.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
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
    enableEditing,
    cancelEditing
} = constraintSlice.actions;

export default constraintSlice.reducer;