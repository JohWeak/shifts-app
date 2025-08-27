// frontend/src/app/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from 'shared/api/apiService';

// --- (Thunks) ---
export const login = createAsyncThunk(
    'auth/login',
    async ({ login: identifier, password }, { rejectWithValue }) => {

        try {

            const userData = await authAPI.loginUser({
                login: identifier,
                password,
            });

            // userData -  { token, user: { id, name, role } })
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

// --- (Slice) ---
const storedUserJSON = localStorage.getItem('user');
let initialUser = null;
try {
    if (storedUserJSON) {
        initialUser = JSON.parse(storedUserJSON);
    }
} catch (error) {
    console.error("Failed to parse user from localStorage:", error);
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
            });
    },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;