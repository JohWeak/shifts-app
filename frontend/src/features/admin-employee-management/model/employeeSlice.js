// frontend/src/features/admin-employee-management/model/employeeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from 'shared/api';
import { API_ENDPOINTS } from 'shared/config/apiEndpoints';

// Async thunks
export const fetchEmployees = createAsyncThunk(
    'employees/fetchAll',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(API_ENDPOINTS.EMPLOYEES.BASE, { params: filters });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchEmployeeDetails = createAsyncThunk(
    'employees/fetchOne',
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await api.get(API_ENDPOINTS.EMPLOYEES.DETAILS(employeeId));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createEmployee = createAsyncThunk(
    'employees/create',
    async (employeeData, { rejectWithValue }) => {
        try {
            const response = await api.post(API_ENDPOINTS.EMPLOYEES.BASE, employeeData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateEmployee = createAsyncThunk(
    'employees/update',
    async ({ employeeId, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(API_ENDPOINTS.EMPLOYEES.DETAILS(employeeId), data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteEmployee = createAsyncThunk(
    'employees/delete',
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await api.delete(API_ENDPOINTS.EMPLOYEES.DETAILS(employeeId));
            return { employeeId, ...response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Initial state
const initialState = {
    employees: [],
    selectedEmployee: null,
    loading: false,
    error: null,
    filters: {
        status: 'all',
        position: 'all',
        search: ''
    },
    pagination: {
        page: 1,
        pageSize: 10,
        total: 0
    }
};

// Slice
const employeeSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.page = 1;
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch employees
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                // Безопасная проверка данных
                if (action.payload) {
                    state.employees = action.payload.data || [];
                    if (action.payload.pagination) {
                        state.pagination = {
                            ...state.pagination,
                            total: action.payload.pagination.total || 0
                        };
                    }
                } else {
                    state.employees = [];
                }
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch employees';
                state.employees = [];
            })
            // Create employee
            .addCase(createEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload?.data) {
                    state.employees.unshift(action.payload.data);
                    state.pagination.total += 1;
                }
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to create employee';
            })
            // Update employee
            .addCase(updateEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateEmployee.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload?.data) {
                    const index = state.employees.findIndex(
                        emp => emp.emp_id === action.payload.data.emp_id
                    );
                    if (index !== -1) {
                        state.employees[index] = action.payload.data;
                    }
                }
            })
            .addCase(updateEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to update employee';
            })
            // Delete employee
            .addCase(deleteEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteEmployee.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload?.employeeId) {
                    state.employees = state.employees.filter(
                        emp => emp.emp_id !== action.payload.employeeId
                    );
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
            })
            .addCase(deleteEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to delete employee';
            });
    }
});

export const { setFilters, setPagination, clearError } = employeeSlice.actions;
export default employeeSlice.reducer;