// frontend/src/app/store/slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authAPI, employeeAPI } from 'shared/api/apiService';

// --- (Thunks) ---
export const login = createAsyncThunk(
    'auth/login',
    async ({ login: identifier, password }, { rejectWithValue }) => {

        try {

            const userData = await authAPI.loginUser({
                login: identifier,
                password,
            });

            // userData -  { token, id, name, role, is_super_admin?, admin_work_sites_scope? }
            localStorage.setItem('token', userData.token);
            const user = {
                emp_id: userData.id,  // Use emp_id to match employee table
                id: userData.id,      // Keep id for compatibility
                name: userData.name,
                email: userData.email,
                role: userData.role,
            };

            // For admin users, include admin-specific fields
            if (userData.role === 'admin') {
                user.is_super_admin = userData.is_super_admin || false;
                user.admin_work_sites_scope = userData.admin_work_sites_scope || [];
            }

            localStorage.setItem('user', JSON.stringify(user));


            return { token: userData.token, user: user };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return rejectWithValue(message);
        }
    },
);

export const updateUserLocale = createAsyncThunk(
    'auth/updateUserLocale',
    async (locale, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const userId = state.auth.user?.id;

            if (!userId) {
                throw new Error('User not authenticated');
            }

            await employeeAPI.updateProfile({ locale });

            return { locale };
        } catch (error) {
            console.error('Failed to update locale in database:', error);
            // Не блокируем UI, просто логируем ошибку
            return rejectWithValue(error.response?.data?.message || 'Failed to update locale');
        }
    },
);

// --- (Slice) ---
const storedUserJSON = localStorage.getItem('user');
let initialUser = null;
try {
    if (storedUserJSON) {
        initialUser = JSON.parse(storedUserJSON);
    }
} catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    initialUser = null;
}

const initialToken = localStorage.getItem('token');

const initialState = {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
    loading: 'idle',
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Сбрасываем состояние
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            state.loading = 'idle';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = 'failed';
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.payload;
            })
            .addCase(updateUserLocale.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.locale = action.payload.locale;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            });
    },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;