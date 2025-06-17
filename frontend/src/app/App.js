import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {Provider, useDispatch} from 'react-redux';
import store from './store/store';
import {I18nProvider} from '../shared/lib/i18n/i18nProvider';
import {ErrorBoundary} from '../shared/ui/ErrorBoundary/ErrorBoundary';
import {fetchSystemSettings} from './store/slices/settingsSlice';

// Pages
import LoginPage from '../pages/LoginPage';
import EmployeeDashboardPage from '../pages/EmployeePages/EmployeeDashboardPage';
import AdminDashboardPage from '../pages/AdminPages/AdminDashboardPage';
import ScheduleManagementPage from '../pages/AdminPages/ScheduleManagementPage';
import AlgorithmSettingsPage from '../pages/AdminPages/AlgorithmSettingsPage';
import EmployeeManagementPage from '../pages/AdminPages/EmployeeManagementPage';
import SystemSettingsPage from '../pages/AdminPages/SystemSettingsPage';
import ReportsPage from '../pages/AdminPages/ReportsPage';

import {ProtectedRoute} from '../shared/lib/auth/ProtectedRoute';
import './App.css';

/**
 * Main Application Component
 * Defines routing structure and authentication flow
 */
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
                            element={<LoginPage/>}
                        />
                        {/* Employee Route */}
                        <Route
                            path="/employee/dashboard"
                            element=
                                {<ProtectedRoute
                                    allowedRole="employee">
                                    <EmployeeDashboardPage/>
                                </ProtectedRoute>}
                        />
                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <AdminDashboardPage/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/schedules"
                            element={<ProtectedRoute
                                allowedRole="admin">
                                <ScheduleManagementPage/>
                            </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/algorithms"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <AlgorithmSettingsPage/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/employees"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <EmployeeManagementPage/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/settings"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <SystemSettingsPage/>
                                </ProtectedRoute>}
                        />
                        <Route
                            path="/admin/reports"
                            element=
                                {<ProtectedRoute
                                    allowedRole="admin">
                                    <ReportsPage/>
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
                <AppContent />
            </I18nProvider>
        </Provider>
    );
}

export default App;