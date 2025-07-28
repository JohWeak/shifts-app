import { combineReducers } from '@reduxjs/toolkit';
import authReducer from 'features/auth/model/authSlice';
import scheduleReducer from 'features/admin-schedule-management/model/scheduleSlice';
import settingsReducer from 'features/admin-system-settings/model/settingsSlice';
import positionReducer from 'features/admin-position-settings/model/positionSlice';
import employeeReducer from 'features/admin-employee-management/model/employeeSlice';
import workplaceReducer from 'features/admin-workplace-settings/model/workplaceSlice';
import notificationsReducer from '../model/notificationsSlice';
import constraintReducer from 'features/employee-constraints/model/constraintSlice';
import employeeDataReducer from 'features/employee-dashboard/model/employeeDataSlice'; // NEW
import requestsReducer from 'features/employee-requests/model/requestsSlice';
import adminRequestsReducer from 'features/admin-permanent-requests/model/adminRequestsSlice';

export const rootReducer = combineReducers({
    auth: authReducer,
    schedule: scheduleReducer,
    settings: settingsReducer,
    position: positionReducer,
    employees: employeeReducer,
    workplace: workplaceReducer,
    notifications: notificationsReducer,
    constraints: constraintReducer,
    employeeData: employeeDataReducer,
    requests: requestsReducer,
    adminRequests: adminRequestsReducer,
});