import { combineReducers } from '@reduxjs/toolkit';
import authReducer from 'features/auth/model/authSlice';
import scheduleReducer from 'features/admin-schedule-management/model/scheduleSlice';
import settingsReducer from 'features/admin-system-settings/model/settingsSlice';
import positionReducer from 'features/admin-position-settings/model/positionSlice';
import employeeReducer from 'features/admin-employee-management/model/employeeSlice';
import workplaceReducer from 'features/admin-workplace-settings/model/workplaceSlice';
import notificationsReducer from '../model/notificationsSlice';

export const rootReducer = combineReducers({
    auth: authReducer,
    schedule: scheduleReducer,
    settings: settingsReducer,
    position: positionReducer,
    employees: employeeReducer,
    workplace: workplaceReducer,
    notifications: notificationsReducer,
    //constraints: constraintsReducer,


});