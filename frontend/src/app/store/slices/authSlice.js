// frontend/src/app/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// --- Асинхронные экшены (Thunks) ---
export const login = createAsyncThunk(
    'auth/login',
    async ({ login: identifier, password }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                login: identifier,
                password,
            });
            const { token, id, name, role } = response.data;
            // Сохраняем в localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ id, name, role }));
            // Устанавливаем заголовок для будущих запросов axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { id, name, role, token };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return rejectWithValue(message);
        }
    }
);

// --- Слайс (Slice) ---

// Начальное состояние, которое пытается восстановить сессию из localStorage
const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: 'idle',
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Синхронный экшен для выхода
        logout(state) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
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
                state.user = {
                    id: action.payload.id,
                    name: action.payload.name,
                    role: action.payload.role,
                };
                state.token = action.payload.token;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = 'failed';
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.payload;
            });
    },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;