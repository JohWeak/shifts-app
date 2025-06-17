import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import scheduleReducer from './slices/scheduleSlice';
import settingsReducer from './slices/settingsSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        schedule: scheduleReducer,
        settings: settingsReducer,
    },
});

export default store;