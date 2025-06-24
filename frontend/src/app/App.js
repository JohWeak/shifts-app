import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {Provider, useDispatch} from 'react-redux';
import store from 'app/store/store';
import {I18nProvider} from 'shared/lib/i18n/i18nProvider';
import {ErrorBoundary} from 'shared/ui/components/ErrorBoundary/ErrorBoundary';
import {fetchSystemSettings} from 'features/admin-system-settings/model/settingsSlice';
import {fetchWorkSites} from 'features/admin-schedule-management/model/scheduleSlice';

// Pages
import Login from '../features/auth';
import EmployeeDashboard from '../features/employee-dashboard';
import AdminDashboard from '../features/admin-dashboard';
import ScheduleManagement from '../features/admin-schedule-management';
import AlgorithmSettings from '../features/admin-algorithm-settings';
import SystemSettings from '../features/admin-system-settings';
import Reports from '../features/admin-reports';
import EmployeeManagement from 'features/admin-employee-management'

import {ProtectedRoute} from '../shared/lib/auth/ProtectedRoute';
import './App.css';

/**
 * Main Application Component
 * Defines routing structure and authentication flow
 */
const AppInitializer = ({children}) => {
    const dispatch = useDispatch();

    useEffect(() => {
        // Загружаем данные параллельно при старте приложения
        Promise.all([
            dispatch(fetchSystemSettings()),
            dispatch(fetchWorkSites())
        ]);
    }, [dispatch]);

    return children;
};


const AppContent = () => {
    // Теперь useDispatch() вызывается ВНУТРИ Provider, и все работает!
    const dispatch = useDispatch();

    useEffect(() => {
        // Загружаем настройки системы при старте
        dispatch(fetchSystemSettings());
    }, [dispatch]);

    return (
        <Router>
            <ErrorBoundary>
                <div className="app">
                    <Routes>
                        {/* Public Route */}
                        <Route
                            path="/login"
                            element={<Login/>}
                        />
                        {/* Employee Route */}
                        <Route
                            path="/employee/dashboard"
                            element=
                                {<ProtectedRoute
                                    allowedRole="employee">
                                    <EmployeeDashboard/>
                                </ProtectedRoute>}
                        />
                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <AdminDashboard/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/schedules"
                            element={<ProtectedRoute
                                allowedRole="admin">
                                <ScheduleManagement/>
                            </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/algorithms"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <AlgorithmSettings/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/employees"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <EmployeeManagement/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/settings"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <SystemSettings/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/reports"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <Reports/>
                                </ProtectedRoute>}
                        />
                        {/* Default Redirects */}
                        <Route
                            path="/"
                            element={<Navigate to="/login" replace/>}/>
                        <Route
                            path="*"
                            element={<Navigate to="/login" replace/>}/>
                    </Routes>
                </div>
            </ErrorBoundary>
        </Router>
    );
};


function App() {
    return (
        <Provider store={store}>
            <I18nProvider>
                <AppInitializer>
                    <AppContent/>
                </AppInitializer>
            </I18nProvider>
        </Provider>
    );
}

export default App;