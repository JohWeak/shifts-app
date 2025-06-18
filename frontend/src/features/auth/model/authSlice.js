// frontend/src/app/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../../shared/api/apiService';

// --- Асинхронные экшены (Thunks) ---
export const login = createAsyncThunk(
    'auth/login',
    async ({ login: identifier, password }, { rejectWithValue }) => {

        try {
            // Вызываем метод из нашего нового, чистого API
            const userData = await authAPI.loginUser({
                login: identifier,
                password,
            });

            // userData - это уже ответ от сервера (например, { token, user: { id, name, role } })
            // Сохраняем в localStorage
            localStorage.setItem('token', userData.token);
            const user = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
            };
            localStorage.setItem('user', JSON.stringify(user));


            return { token: userData.token, user: user };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return rejectWithValue(message);
        }
    }
);

// --- Слайс (Slice) ---
// Безопасно получаем и парсим данные пользователя
const storedUserJSON = localStorage.getItem('user');
let initialUser = null;
try {
    // Парсим, только если что-то есть
    if (storedUserJSON) {
        initialUser = JSON.parse(storedUserJSON);
    }
} catch (error) {
    console.error("Failed to parse user from localStorage:", error);
    // Если в localStorage поврежденный JSON, считаем, что пользователя нет
    initialUser = null;
}

const initialToken = localStorage.getItem('token');

// Начальное состояние, которое 100% безопасное
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
        // Синхронный экшен для выхода
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
                // action.payload теперь содержит весь объект, который вернул thunk
                state.user = action.payload.user;
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