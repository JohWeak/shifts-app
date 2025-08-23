// frontend/src/shared/lib/auth/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';

export const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    if (loading === 'pending') {
        return <LoadingState size="lg" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRole && user?.role !== allowedRole) {
        const homePath = user.role === 'admin' ? '/admin' : '/employee';
        return <Navigate to={homePath} replace />;
    }

    return children;
};