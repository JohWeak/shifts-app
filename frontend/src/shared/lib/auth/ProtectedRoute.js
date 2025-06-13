// frontend/src/shared/lib/auth/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ children, allowedRole }) => {
    // Получаем актуальные данные из Redux store
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const location = useLocation();

    // Если не аутентифицирован, перенаправляем на логин,
    // запоминая, откуда пользователь пришел, чтобы вернуть его обратно после входа.
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Если роль не совпадает, перенаправляем на соответствующий дашборд
    if (allowedRole && user?.role !== allowedRole) {
        const redirectPath = user?.role === 'admin' ? '/admin' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // Если все проверки пройдены, отображаем дочерний компонент
    return children;
};