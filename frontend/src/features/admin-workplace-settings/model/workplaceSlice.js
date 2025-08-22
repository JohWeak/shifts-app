// frontend/src/features/admin-workplace-settings/model/workplaceSlice.js
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from 'shared/api';
import {API_ENDPOINTS} from 'shared/config/apiEndpoints';
import {
    CACHE_DURATION,
    isCacheEntryValid,
    getCacheEntry,
    setCacheEntry,
    clearCacheEntry
} from 'shared/lib/cache/cacheUtils';

// Fetch work sites with cache
export const fetchWorkSites = createAsyncThunk(
    'workplace/fetchWorkSites',
    async ({includeStats = true, forceRefresh = false} = {}, {getState, rejectWithValue}) => {
        const state = getState();
        const {cache, cacheDurations} = state.workplace;

        // Check cache
        if (!forceRefresh && isCacheEntryValid(cache.workSites, cacheDurations.workSites)) {
            console.log('[Cache] Using cached work sites');
            return {cached: true, data: cache.workSites.data};
        }

        try {
            console.log('[Cache] Fetching fresh work sites');
            const response = await api.get(API_ENDPOINTS.WORKSITES.BASE, {
                params: {includeStats}
            });
            return {cached: false, data: response};
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch work sites');
        }
    }
);

export const createWorkSite = createAsyncThunk(
    'workplace/createWorkSite',
    async (siteData, {rejectWithValue}) => {
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
    async ({id, ...data}, {rejectWithValue}) => {
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
    async (id, {rejectWithValue}) => {
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
    async (id, {rejectWithValue}) => {
        try {
            const response = await api.post(`${API_ENDPOINTS.WORKSITES.BASE}/${id}/restore`);
            return response.site;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to restore work site');
        }
    }
);

// Fetch positions with cache
export const fetchPositions = createAsyncThunk(
    'workplace/fetchPositions',
    async ({forceRefresh = false} = {}, {getState, rejectWithValue}) => {
        const state = getState();
        const {cache, cacheDurations} = state.workplace;

        // Check cache
        if (!forceRefresh && isCacheEntryValid(cache.positions, cacheDurations.positions)) {
            console.log('[Cache] Using cached positions');
            return {cached: true, data: cache.positions.data};
        }

        try {
            console.log('[Cache] Fetching fresh positions');
            const response = await api.get(API_ENDPOINTS.SETTINGS.POSITIONS);
            return {cached: false, data: response};
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions');
        }
    }
);

export const createPosition = createAsyncThunk(
    'workplace/createPosition',
    async (positionData, {rejectWithValue}) => {
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
    async ({id, ...data}, {rejectWithValue}) => {
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
    async (id, {rejectWithValue}) => {
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
    async (id, {rejectWithValue}) => {
        try {
            const response = await api.post(`${API_ENDPOINTS.SETTINGS.POSITIONS}/${id}/restore`);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to restore position');
        }
    }
);

// Fetch position shifts with cache
export const fetchPositionShifts = createAsyncThunk(
    'workplace/fetchPositionShifts',
    async ({positionId, forceRefresh = false}, {getState, rejectWithValue}) => {
        const state = getState();
        const {cache, cacheDurations} = state.workplace;
        const cached = getCacheEntry(cache.positionShifts, positionId);

        // Check cache
        if (!forceRefresh && cached && isCacheEntryValid(cached, cacheDurations.positionShifts)) {
            console.log(`[Cache] Using cached shifts for position ${positionId}`);
            return {cached: true, positionId, data: cached.data};
        }

        try {
            console.log(`[Cache] Fetching fresh shifts for position ${positionId}`);
            const response = await api.get(
                API_ENDPOINTS.SETTINGS.POSITION_SHIFTS.replace(':id', positionId)
            );
            return {cached: false, positionId, data: response};
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch position shifts');
        }
    }
);

export const createPositionShift = createAsyncThunk(
    'workplace/createPositionShift',
    async ({positionId, shiftData}, {rejectWithValue}) => {
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
    async ({shiftId, shiftData}, {rejectWithValue}) => {
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
    async (shiftId, {rejectWithValue}) => {
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
    async ({positionId, forceRefresh = false}, {getState, rejectWithValue}) => {
        const state = getState();
        const {cache, cacheDurations} = state.workplace;
        const cached = getCacheEntry(cache.requirementsMatrix, positionId);

        // Check cache
        if (!forceRefresh && cached && isCacheEntryValid(cached, cacheDurations.requirementsMatrix)) {
            console.log(`[Cache] Using cached requirements matrix for position ${positionId}`);
            return {cached: true, positionId, data: cached.data};
        }

        try {
            console.log(`[Cache] Fetching fresh requirements matrix for position ${positionId}`);
            const response = await api.get(
                API_ENDPOINTS.SETTINGS.POSITION_REQUIREMENTS_MATRIX.replace(':id', positionId)
            );
            return {cached: false, positionId, data: response};
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requirements matrix');
        }
    }
);


export const updateShiftRequirement = createAsyncThunk(
    'workplace/updateShiftRequirement',
    async ({requirementId, data}, {rejectWithValue}) => {
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
    async ({shiftId, data}, {rejectWithValue}) => {
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

// Preload all workplace data
export const preloadWorkplaceData = createAsyncThunk(
    'workplace/preloadWorkplaceData',
    async (_, {dispatch, getState}) => {
        console.log('[Cache] Preloading workplace data...');

        // Load work sites and positions in parallel
        const [workSitesResult, positionsResult] = await Promise.all([
            dispatch(fetchWorkSites()),
            dispatch(fetchPositions())
        ]);

        // Get loaded positions
        const state = getState();
        const positions = state.workplace.positions;

        // Preload shifts and requirements matrix for all positions (batch by 3)
        const batchSize = 3;
        let loadedShifts = 0;
        let loadedMatrices = 0;

        for (let i = 0; i < positions.length; i += batchSize) {
            const batch = positions.slice(i, i + batchSize);

            // Load both shifts and matrix for each position in parallel
            const batchPromises = batch.flatMap(position => [
                dispatch(fetchPositionShifts({positionId: position.pos_id})),
                dispatch(fetchRequirementsMatrix({positionId: position.pos_id}))
            ]);

            await Promise.all(batchPromises);
            loadedShifts += batch.length;
            loadedMatrices += batch.length;
        }

        console.log(`[Cache] Preloaded: ${state.workplace.workSites.length} sites, ${positions.length} positions, ${loadedShifts} shifts, ${loadedMatrices} matrices`);
        return {
            sites: state.workplace.workSites.length,
            positions: positions.length,
            shifts: loadedShifts,
            matrices: loadedMatrices
        };
    }
);

// Slice
const workplaceSlice = createSlice({
    name: 'workplace',
    initialState: {
        // Data
        workSites: [],
        positions: [],

        // Loading states
        loading: false,
        listLoading: false,
        operationLoading: false,
        positionsLoading: false,
        shiftsLoading: false,
        matrixLoading: false,

        // Errors and status
        error: null,
        operationStatus: null,
        positionOperationStatus: null,
        shiftOperationStatus: null,

        // Nested data
        positionShifts: {}, // { [positionId]: shifts[] }
        requirementsMatrix: {}, // { [positionId]: matrix }

        // Unified cache
        cache: {
            workSites: null, // { data: [], timestamp: Date.now() }
            positions: null, // { data: [], timestamp: Date.now() }
            positionShifts: {}, // { [positionId]: { data: shifts[], timestamp: Date.now() } }
            requirementsMatrix: {} // { [positionId]: { data: matrix, timestamp: Date.now() } }
        },

        // Cache durations
        cacheDurations: {
            workSites: CACHE_DURATION.LONG,
            positions: CACHE_DURATION.LONG,
            positionShifts: CACHE_DURATION.LONG,
            requirementsMatrix: CACHE_DURATION.LONG
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
            },
            clearCache(state, action) {
                const { type, key } = action.payload || {};

                if (type === 'workSites') {
                    state.cache.workSites = null;
                } else if (type === 'positions') {
                    state.cache.positions = null;
                } else if (type === 'positionShifts') {
                    if (key) {
                        clearCacheEntry(state.cache.positionShifts, key);
                    } else {
                        state.cache.positionShifts = {};
                    }
                } else if (type === 'requirementsMatrix') {
                    if (key) {
                        clearCacheEntry(state.cache.requirementsMatrix, key);
                    } else {
                        state.cache.requirementsMatrix = {};
                    }
                } else {
                    // Clear all
                    state.cache = {
                        workSites: null,
                        positions: null,
                        positionShifts: {},
                        requirementsMatrix: {}
                    };
                }
            }
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
                state.workSites = action.payload.data || [];

                if (!action.payload.cached) {
                    setCacheEntry(state.cache, 'workSites', action.payload.data);
                }
            })
            .addCase(fetchWorkSites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.workSites = [];
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
                state.cache.workSites = null;
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
                state.cache.workSites = null;
            })
            // Delete work site
            .addCase(deleteWorkSite.fulfilled, (state, action) => {
                state.workSites = state.workSites.filter(site => site.site_id !== action.payload);
                state.operationStatus = 'success';
                state.cache.workSites = null;
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
                state.cache.workSites = null;
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
                state.positions = action.payload.data || [];


                if (!action.payload.cached) {
                    setCacheEntry(state.cache, 'positions', action.payload.data);
                }
            })
            .addCase(fetchPositions.rejected, (state, action) => {
                state.positionsLoading = false;
                state.error = action.payload;
                state.positions = [];
            })
            // Create position
            .addCase(createPosition.fulfilled, (state, action) => {
                state.loading = false;
                const newPosition = action.payload;
                if (newPosition && typeof newPosition === 'object' && newPosition.pos_id) {
                    state.positions.push(newPosition);
                    state.positionOperationStatus = 'success';
                    state.cache.positions = null;
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
                state.cache.positions = null;
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
                state.cache.positions = null;
            })
            .addCase(deletePosition.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload;
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
                state.cache.positions = null;
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
                state.positionShifts[action.payload.positionId] = action.payload.data;

                if (!action.payload.cached) {
                    setCacheEntry(state.cache.positionShifts, action.payload.positionId, action.payload.data);
                }
            })
            .addCase(fetchPositionShifts.rejected, (state, action) => {
                state.shiftsLoading = false;
                state.error = action.payload;
            })

            // Create shift
            .addCase(createPositionShift.fulfilled, (state, action) => {
                state.shiftOperationStatus = 'success';
                const positionId = action.meta.arg.positionId;
                if (state.positionShifts[positionId]) {
                    state.positionShifts[positionId].push(action.payload);
                }
                state.cache.positionShifts = null;
            })
            .addCase(createPositionShift.rejected, (state, action) => {
                state.error = action.payload;
                state.shiftOperationStatus = 'error';
            })

            // Update shift
            .addCase(updatePositionShift.fulfilled, (state, action) => {
                state.shiftOperationStatus = 'success';
                Object.keys(state.positionShifts).forEach(posId => {
                    const shiftIndex = state.positionShifts[posId].findIndex(
                        s => s.id === action.payload.id
                    );
                    if (shiftIndex !== -1) {
                        state.positionShifts[posId][shiftIndex] = action.payload;
                    }
                });
                state.cache.positionShifts = null;
            })
            .addCase(updatePositionShift.rejected, (state, action) => {
                state.error = action.payload;
                state.shiftOperationStatus = 'error';
            })

            // Delete shift
            .addCase(deletePositionShift.fulfilled, (state, action) => {
                state.shiftOperationStatus = 'success';
                Object.keys(state.positionShifts).forEach(posId => {
                    state.positionShifts[posId] = state.positionShifts[posId].filter(
                        s => s.id !== action.payload
                    );
                });
                state.cache.positionShifts = null;
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
                state.requirementsMatrix[action.payload.positionId] = action.payload.data;

                // Update cache only if fresh data
                if (!action.payload.cached) {
                    setCacheEntry(state.cache.requirementsMatrix, action.payload.positionId, action.payload.data);
                }
            })
            .addCase(fetchRequirementsMatrix.rejected, (state, action) => {
                state.matrixLoading = false;
                state.error = action.payload;
            })
            .addCase(createShiftRequirement.fulfilled, (state, action) => {
                // Clear matrix cache for affected position
                const positionId = action.meta.arg.positionId;
                if (positionId) {
                    clearCacheEntry(state.cache.requirementsMatrix, positionId);
                }
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
    clearShiftOperationStatus,
    clearCache
} = workplaceSlice.actions;
export default workplaceSlice.reducer;