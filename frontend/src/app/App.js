import React, {useEffect} from 'react';
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
    Outlet
} from 'react-router-dom';import {Provider, useDispatch} from 'react-redux';
import store from 'app/store/store';
import {I18nProvider} from 'shared/lib/i18n/i18nProvider';
import {ErrorBoundary} from 'shared/ui/components/ErrorBoundary/ErrorBoundary';
import {fetchSystemSettings} from 'features/admin-system-settings/model/settingsSlice';
import {fetchWorkSites} from 'features/admin-schedule-management/model/scheduleSlice';

// Pages
import Login from '../features/auth';

import EmployeeLayout from '../shared/ui/layouts/EmployeeLayout/EmployeeLayout';
import EmployeeSchedule from '../features/employee-schedule';
import EmployeeConstraints from '../features/employee-constraints';
import EmployeeRequests from '../features/employee-requests';
import EmployeeArchive from '../features/employee-archive';
import EmployeeManagement from 'features/admin-employee-management'
import EmployeeDashboard from "../features/employee-dashboard";

import AdminLayout from '../shared/ui/layouts/AdminLayout/AdminLayout';
import AdminDashboard from '../features/admin-dashboard';
import ScheduleManagement from '../features/admin-schedule-management';
import AlgorithmSettings from '../features/admin-algorithm-settings';
import SystemSettings from '../features/admin-system-settings';
import WorkplaceSettings from '../features/admin-workplace-settings';
import Reports from '../features/admin-reports';
import AdminPermanentRequests from '../features/admin-permanent-requests';

import {ProtectedRoute} from '../shared/lib/auth/ProtectedRoute';
import './App.css';
/**
 * Main Application Component
 * Defines routing structure and authentication flow
 */
const AppInitializer = ({ children }) => {
    const dispatch = useDispatch();
    useEffect(() => {
        Promise.all([
            dispatch(fetchSystemSettings()),
            dispatch(fetchWorkSites())
        ]);
    }, [dispatch]);
    return children;
};

const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    {
        path: "/employee",
        element: <ProtectedRoute allowedRole="employee"><EmployeeLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <Navigate to="/employee/dashboard" replace /> },
            { path: "dashboard", element: <EmployeeDashboard /> }, // <-- ДОБАВЛЕННАЯ СТРОКА
            { path: "schedule", element: <EmployeeSchedule /> },
            { path: "constraints", element: <EmployeeConstraints /> },
            { path: "requests", element: <EmployeeRequests /> },
            { path: "archive", element: <EmployeeArchive /> },
        ],
    },

    {
        path: "/admin",
        element: <ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: "schedules", element: <ScheduleManagement /> },
            { path: "algorithms", element: <AlgorithmSettings /> },
            { path: "employees", element: <EmployeeManagement /> },
            { path: "workplace", element: <WorkplaceSettings /> },
            { path: "reports", element: <Reports /> },
            { path: "permanent-requests", element:<AdminPermanentRequests /> },

            { path: "my-employee-profile", element: <EmployeeLayout /> }, // Админ как работник

        ],
    },
    { path: "/", element: <Navigate to="/login" replace /> },
    { path: "*", element: <Navigate to="/login" replace /> },
]);
// --- Конец новой части ---

function App() {
    return (
        <Provider store={store}>
            <I18nProvider>
                <AppInitializer>
                    <ErrorBoundary>
                        <div className="app">
                            <RouterProvider router={router} />
                        </div>
                    </ErrorBoundary>
                </AppInitializer>
            </I18nProvider>
        </Provider>
    );
}

export default App;