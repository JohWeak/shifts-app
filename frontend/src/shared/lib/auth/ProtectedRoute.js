// frontend/src/shared/lib/auth/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';

export const ProtectedRoute = ({ children, allowedRole }) => {
    // Получаем все нужные состояния из Redux store
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    // 1. Если идет процесс аутентификации, показываем заглушку-загрузчик
    if (loading === 'pending') {
        return <LoadingState size="lg" />;
    }

    // 2. Если процесс завершен, и пользователь НЕ аутентифицирован
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Если роль не совпадает
    if (allowedRole && user?.role !== allowedRole) {
        const homePath = user.role === 'admin' ? '/admin' : '/employee';
        return <Navigate to={homePath} replace />;
    }

    // 4. Если все проверки пройдены
    return children;
};