// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Import components
import Login from './components/auth/LoginPage';
import EmployeeDashboard from './components/employee/Dashboard';

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
            return <Navigate to="/admin/dashboard" />;
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

                        {/* Admin routes (placeholder) */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <ProtectedRoute allowedRole="admin">
                                    <div>Admin Dashboard (To be implemented)</div>
                                </ProtectedRoute>
                            }
                        />

                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </div>
            </Router>
        </Provider>
    );
}

export default App;