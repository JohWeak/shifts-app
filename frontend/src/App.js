// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Authentication
import Login from './components/auth/LoginPage';

// Employee Components
import EmployeeDashboard from './components/employee/Dashboard';

// Admin Components
import AdminDashboard from './components/admin/Dashboard';
import ScheduleManagement from './components/admin/ScheduleManagement';
import AlgorithmSettings from './components/admin/AlgorithmSettings';
import EmployeeManagement from './components/admin/EmployeeManagement';
import SystemSettings from './components/admin/SystemSettings';
import Reports from './components/admin/Reports';

/**
 * Protected Route Wrapper
 * Handles authentication and role-based access control
 */

const ProtectedRoute = ({ children, allowedRole }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAuthenticated = !!localStorage.getItem('token');

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role-based redirection
    if (allowedRole && user?.role !== allowedRole) {
        const redirectPath = user?.role === 'admin' ? '/admin' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

/**
 * Main Application Component
 * Defines routing structure and authentication flow
 */
function App() {
    return (
        <Provider store={store}>
            <Router>
                <div className="app">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />

                        {/* Employee Routes */}
                        <Route
                            path="/employee/dashboard"
                            element={
                                <ProtectedRoute allowedRole="employee">
                                    <EmployeeDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <AdminDashboard />
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

                        {/* Default Redirects */}
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        {/* Fallback for unmatched routes */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </div>
            </Router>
        </Provider>
    );
}

export default App;