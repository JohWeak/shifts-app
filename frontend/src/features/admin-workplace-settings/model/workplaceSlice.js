// frontend/src/features/admin-workplace-settings/model/workplaceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from 'shared/api';
import { API_ENDPOINTS } from 'shared/config/apiEndpoints';

// Async thunks
export const fetchWorkSites = createAsyncThunk(
    'workplace/fetchWorkSites',
    async ({ includeStats = true } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(API_ENDPOINTS.WORKSITES.BASE, {
                params: { includeStats }
            });
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch work sites');
        }
    }
);

export const createWorkSite = createAsyncThunk(
    'workplace/createWorkSite',
    async (siteData, { rejectWithValue }) => {
        try {
            const response = await api.post(API_ENDPOINTS.WORKSITES.BASE, siteData);
            return response; // Без .data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create work site');
        }
    }
);

export const updateWorkSite = createAsyncThunk(
    'workplace/updateWorkSite',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`${API_ENDPOINTS.WORKSITES.BASE}/${id}`, data);
            return response; // Без .data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update work site');
        }
    }
);

export const deleteWorkSite = createAsyncThunk(
    'workplace/deleteWorkSite',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`${API_ENDPOINTS.WORKSITES.BASE}/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete work site');
        }
    }
);

export const restoreWorkSite = createAsyncThunk(
    'workplace/restoreWorkSite',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`${API_ENDPOINTS.WORKSITES.BASE}/${id}/restore`);
            return response.site;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to restore work site');
        }
    }
);

export const fetchPositions = createAsyncThunk(
    'workplace/fetchPositions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get(API_ENDPOINTS.SETTINGS.POSITIONS);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions');
        }
    }
);

export const createPosition = createAsyncThunk(
    'workplace/createPosition',
    async (positionData, { rejectWithValue }) => {
        try {
            const response = await api.post(API_ENDPOINTS.SETTINGS.POSITIONS, positionData);
            console.log('Create position response:', response); // Для отладки
            return response; // response уже содержит данные благодаря interceptor
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create position');
        }
    }
);

export const updatePosition = createAsyncThunk(
    'workplace/updatePosition',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            const response = await api.put(API_ENDPOINTS.SETTINGS.POSITION_UPDATE(id), data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update position');
        }
    }
);

export const deletePosition = createAsyncThunk(
    'workplace/deletePosition',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(API_ENDPOINTS.SETTINGS.POSITION_UPDATE(id));
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete position');
        }
    }
);

export const restorePosition = createAsyncThunk(
    'workplace/restorePosition',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.post(`${API_ENDPOINTS.SETTINGS.POSITIONS}/${id}/restore`);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to restore position');
        }
    }
);

// Position Shifts
export const fetchPositionShifts = createAsyncThunk(
    'workplace/fetchPositionShifts',
    async (positionId, { rejectWithValue }) => {
        try {
            const response = await api.get(
                API_ENDPOINTS.SETTINGS.POSITION_SHIFTS.replace(':id', positionId)
            );
            return { positionId, shifts: response };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch position shifts');
        }
    }
);

export const createPositionShift = createAsyncThunk(
    'workplace/createPositionShift',
    async ({ positionId, shiftData }, { rejectWithValue }) => {
        try {
            const response = await api.post(
                API_ENDPOINTS.SETTINGS.POSITION_SHIFTS.replace(':id', positionId),
                shiftData
            );
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create shift');
        }
    }
);

export const updatePositionShift = createAsyncThunk(
    'workplace/updatePositionShift',
    async ({ shiftId, shiftData }, { rejectWithValue }) => {
        try {
            const response = await api.put(
                API_ENDPOINTS.SETTINGS.POSITION_SHIFT.replace(':id', shiftId),
                shiftData
            );
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update shift');
        }
    }
);

export const deletePositionShift = createAsyncThunk(
    'workplace/deletePositionShift',
    async (shiftId, { rejectWithValue }) => {
        try {
            await api.delete(
                API_ENDPOINTS.SETTINGS.POSITION_SHIFT.replace(':id', shiftId)
            );
            return shiftId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete shift');
        }
    }
);

// Requirements Matrix
export const fetchRequirementsMatrix = createAsyncThunk(
    'workplace/fetchRequirementsMatrix',
    async (positionId, { rejectWithValue }) => {
        try {
            const response = await api.get(
                API_ENDPOINTS.SETTINGS.POSITION_REQUIREMENTS_MATRIX.replace(':id', positionId)
            );
            return { positionId, matrix: response };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requirements matrix');
        }
    }
);

export const updateShiftRequirement = createAsyncThunk(
    'workplace/updateShiftRequirement',
    async ({ requirementId, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(
                API_ENDPOINTS.SETTINGS.SHIFT_REQUIREMENT.replace(':id', requirementId),
                data
            );
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update requirement');
        }
    }
);

export const createShiftRequirement = createAsyncThunk(
    'workplace/createShiftRequirement',
    async ({ shiftId, data }, { rejectWithValue }) => {
        try {
            const response = await api.post(
                API_ENDPOINTS.SETTINGS.SHIFT_REQUIREMENTS.replace(':id', shiftId),
                data
            );
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create requirement');
        }
    }
);

// Slice
const workplaceSlice = createSlice({
    name: 'workplace',
    initialState: {
        workSites: [],
        positions: [],
        loading: false,
        listLoading: false,       // Для загрузки списков
        operationLoading: false, // Для CRUD операций
        positionsLoading: false,
        error: null,
        operationStatus: null, // 'success' | 'error' | null
        positionOperationStatus: null,
        positionShifts: {}, // { [positionId]: shifts[] }
        requirementsMatrix: {}, // { [positionId]: matrix }
        shiftsLoading: false,
        matrixLoading: false,
        shiftOperationStatus: null
    },
    reducers: {
        clearOperationStatus: (state) => {
            state.operationStatus = null;
            state.error = null;
        },
        clearPositionOperationStatus: (state) => {
            state.positionOperationStatus = null;
            state.error = null;
        },
        clearShiftOperationStatus: (state) => {
            state.shiftOperationStatus = null;
        }

    },
    extraReducers: (builder) => {
        // Fetch work sites
        builder
            .addCase(fetchWorkSites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkSites.fulfilled, (state, action) => {
                state.loading = false;
                state.workSites = action.payload || []; // Защита от undefined
                console.log('WorkSites saved to store:', state.workSites);
            })
            .addCase(fetchWorkSites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.workSites = []; // Устанавливаем пустой массив при ошибке
            })
            // Create work site
            .addCase(createWorkSite.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWorkSite.fulfilled, (state, action) => {
                state.loading = false;
                state.workSites.push(action.payload);
                state.operationStatus = 'success';
            })
            .addCase(createWorkSite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.operationStatus = 'error';
            })
            // Update work site
            .addCase(updateWorkSite.fulfilled, (state, action) => {
                const index = state.workSites.findIndex(site => site.site_id === action.payload.site_id);
                if (index !== -1) {
                    state.workSites[index] = action.payload;
                }
                state.operationStatus = 'success';
            })
            // Delete work site
            .addCase(deleteWorkSite.fulfilled, (state, action) => {
                state.workSites = state.workSites.filter(site => site.site_id !== action.payload);
                state.operationStatus = 'success';
            })
            .addCase(deleteWorkSite.rejected, (state, action) => {
                state.error = action.payload;
                state.operationStatus = 'error';
            })
            .addCase(restoreWorkSite.fulfilled, (state, action) => {
                const index = state.workSites.findIndex(site => site.site_id === action.payload.site_id);
                if (index !== -1) {
                    state.workSites[index] = action.payload;
                }
                state.operationStatus = 'success';
            })
            .addCase(restoreWorkSite.rejected, (state, action) => {
                state.error = action.payload;
                state.operationStatus = 'error';
            })

            // Positions
            .addCase(fetchPositions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPositions.fulfilled, (state, action) => {
                state.positionsLoading = false;
                state.positions = action.payload || []; // Защита от undefined
                console.log('Positions saved to store:', state.positions);
            })
            .addCase(fetchPositions.rejected, (state, action) => {
                state.positionsLoading = false;
                state.error = action.payload;
                state.positions = []; // Устанавливаем пустой массив при ошибке
            })
            // Create position
            .addCase(createPosition.fulfilled, (state, action) => {
                state.loading = false;
                // Безопасная проверка структуры ответа
                const newPosition = action.payload;
                if (newPosition && typeof newPosition === 'object' && newPosition.pos_id) {
                    state.positions.push(newPosition);
                    state.positionOperationStatus = 'success';
                } else {
                    console.error('Invalid position data received:', newPosition);
                    state.error = 'Invalid response format';
                    state.positionOperationStatus = 'error';
                }
            })
            .addCase(createPosition.rejected, (state, action) => {
                state.error = action.payload;
                state.positionOperationStatus = 'error';
            })
            // Update position
            .addCase(updatePosition.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(updatePosition.fulfilled, (state, action) => {
                state.operationLoading = false;
                const index = state.positions.findIndex(pos => pos.pos_id === action.payload.pos_id);
                if (index !== -1) {
                    state.positions[index] = action.payload;
                }
                state.positionOperationStatus = 'success';
            })
            .addCase(updatePosition.rejected, (state, action) => { // <-- ДОБАВЛЯЕМ REJECTED
                state.operationLoading = false;
                state.error = action.payload;
                state.positionOperationStatus = 'error';
            })
            // Delete position
            .addCase(deletePosition.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(deletePosition.fulfilled, (state, action) => {
                state.operationLoading = false;
                state.positions = state.positions.filter(pos => pos.pos_id !== action.payload);
                state.positionOperationStatus = 'success';
            })
            .addCase(deletePosition.rejected, (state, action) => {
                state.operationLoading = false;                state.error = action.payload;
                state.positionOperationStatus = 'error';
            })
            // Restore Position
            .addCase(restorePosition.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(restorePosition.fulfilled, (state, action) => {
                state.operationLoading = false;
                const index = state.positions.findIndex(pos => pos.pos_id === action.payload.position.pos_id);
                if (index !== -1) {
                    state.positions[index] = action.payload.position;
                }
                state.positionOperationStatus = 'success';
            })
            .addCase(restorePosition.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload;
                state.positionOperationStatus = 'error';
            })
            // Position Shifts
            .addCase(fetchPositionShifts.pending, (state) => {
                state.shiftsLoading = true;
            })
            .addCase(fetchPositionShifts.fulfilled, (state, action) => {
                state.shiftsLoading = false;
                state.positionShifts[action.payload.positionId] = action.payload.shifts;
            })
            .addCase(fetchPositionShifts.rejected, (state, action) => {
                state.shiftsLoading = false;
                state.error = action.payload;
            })

            // Create shift
            .addCase(createPositionShift.fulfilled, (state, action) => {
                state.shiftOperationStatus = 'success';
                // Обновляем локальный список если он загружен
                const positionId = action.meta.arg.positionId;
                if (state.positionShifts[positionId]) {
                    state.positionShifts[positionId].push(action.payload);
                }
            })
            .addCase(createPositionShift.rejected, (state, action) => {
                state.error = action.payload;
                state.shiftOperationStatus = 'error';
            })

            // Update shift
            .addCase(updatePositionShift.fulfilled, (state, action) => {
                state.shiftOperationStatus = 'success';
                // Обновляем в всех загруженных позициях
                Object.keys(state.positionShifts).forEach(posId => {
                    const shiftIndex = state.positionShifts[posId].findIndex(
                        s => s.id === action.payload.id
                    );
                    if (shiftIndex !== -1) {
                        state.positionShifts[posId][shiftIndex] = action.payload;
                    }
                });
            })
            .addCase(updatePositionShift.rejected, (state, action) => {
                state.error = action.payload;
                state.shiftOperationStatus = 'error';
            })

            // Delete shift
            .addCase(deletePositionShift.fulfilled, (state, action) => {
                state.shiftOperationStatus = 'success';
                // Удаляем из всех загруженных позиций
                Object.keys(state.positionShifts).forEach(posId => {
                    state.positionShifts[posId] = state.positionShifts[posId].filter(
                        s => s.id !== action.payload
                    );
                });
            })
            .addCase(deletePositionShift.rejected, (state, action) => {
                state.error = action.payload;
                state.shiftOperationStatus = 'error';
            })

            // Requirements Matrix
            .addCase(fetchRequirementsMatrix.pending, (state) => {
                state.matrixLoading = true;
            })
            .addCase(fetchRequirementsMatrix.fulfilled, (state, action) => {
                state.matrixLoading = false;
                state.requirementsMatrix[action.payload.positionId] = action.payload.matrix;
            })
            .addCase(fetchRequirementsMatrix.rejected, (state, action) => {
                state.matrixLoading = false;
                state.error = action.payload;
            })
            .addCase(updateShiftRequirement.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(createShiftRequirement.rejected, (state, action) => {
                state.error = action.payload;
            });




    }
});

export const {
    clearOperationStatus,
    clearPositionOperationStatus,
    clearShiftOperationStatus
} = workplaceSlice.actions;
export default workplaceSlice.reducer;