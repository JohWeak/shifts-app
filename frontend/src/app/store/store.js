import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/model/authSlice';
import scheduleReducer from '../../features/admin-schedule-management/model/scheduleSlice';
import settingsReducer from '../../features/admin-system-settings/model/settingsSlice';
import positionReducer from '../../features/admin-position-settings/model/positionSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        schedule: scheduleReducer,
        settings: settingsReducer,
        positions: positionReducer,
    },
});

export default store;