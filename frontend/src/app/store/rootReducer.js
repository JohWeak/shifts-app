import { combineReducers } from '@reduxjs/toolkit';
import authReducer from 'features/auth/model/authSlice';
import scheduleReducer from 'features/admin-schedule-management/model/scheduleSlice';
import settingsReducer from 'features/admin-system-settings/model/settingsSlice';
import positionReducer from 'features/admin-position-settings/model/positionSlice';

export const rootReducer = combineReducers({
    auth: authReducer,
    schedule: scheduleReducer,
    settings: settingsReducer,
    position: positionReducer,
});