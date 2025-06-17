import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import scheduleReducer from './slices/scheduleSlice';
import settingsReducer from './slices/settingsSlice';
import positionReducer from './slices/positionSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        schedule: scheduleReducer,
        settings: settingsReducer,
        positions: positionReducer,
    },
});

export default store;