import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store'; // Путь изменился

// Pages
import LoginPage from '../pages/LoginPage';
import EmployeeDashboardPage from '../pages/EmployeeDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ScheduleManagementPage from '../pages/ScheduleManagementPage';
// ... импорты для других страниц (EmployeeManagementPage, ReportsPage, etc.)

// Shared UI/lib
import { ProtectedRoute } from '../shared/lib/auth'; // Вынесем ProtectedRoute в утилиты

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
                        {/* Public Route */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Employee Route */}
                        <Route
                            path="/employee/dashboard"
                            element={
                                <ProtectedRoute allowedRole="employee">
                                    <EmployeeDashboardPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                        <Route path="/admin/schedules" element={<ProtectedRoute allowedRole="admin"><ScheduleManagementPage /></ProtectedRoute>} />
                        {/* Добавьте другие админские роуты по аналогии */}

                        {/* Default Redirects */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </div>
            </Router>
        </Provider>
    );
}

export default App;