// frontend/src/shared/lib/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user?.role !== allowedRole) {
        const redirectPath = user?.role === 'admin' ? '/admin' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};