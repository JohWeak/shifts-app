// frontend/src/App.js - ОБНОВЛЕННАЯ ВЕРСИЯ
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Import components
import Login from './components/auth/LoginPage';
import EmployeeDashboard from './components/employee/Dashboard';

// Admin components
import ScheduleManagement from './components/admin/ScheduleManagement';
import Dashboard from './components/admin/Dashboard'; // Старый дашборд переименуем
import AlgorithmSettings from './components/admin/AlgorithmSettings';
import EmployeeManagement from './components/admin/EmployeeManagement';
import SystemSettings from './components/admin/SystemSettings';
import Reports from './components/admin/Reports';

// Protected route component
const ProtectedRoute = ({ children, allowedRole }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (allowedRole && user?.role !== allowedRole) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'admin') {
            return <Navigate to="/admin/schedules" />; // ✅ Админ идет сразу на расписания
        } else {
            return <Navigate to="/employee/dashboard" />;
        }
    }

    return children;
};

function App() {
    return (
        <Provider store={store}>
            <Router>
                <div className="app">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />

                        {/* Employee routes */}
                        <Route
                            path="/employee/dashboard"
                            element={
                                <ProtectedRoute allowedRole="employee">
                                    <EmployeeDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin routes */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/schedules"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <ScheduleManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/algorithms"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <AlgorithmSettings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/employees"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <EmployeeManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/settings"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <SystemSettings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/reports"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />

                        {/* Default redirects */}
                        <Route path="/admin" element={<Navigate to="/admin/schedules" />} />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </div>
            </Router>
        </Provider>
    );
}

export default App;