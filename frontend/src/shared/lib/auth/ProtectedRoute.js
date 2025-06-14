// frontend/src/shared/lib/auth/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap'; // Импортируем спиннер

export const ProtectedRoute = ({ children, allowedRole }) => {
    // Получаем все нужные состояния из Redux store
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    // 1. Если идет процесс аутентификации, показываем заглушку-загрузчик
    if (loading === 'pending') {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    // 2. Если процесс завершен и пользователь НЕ аутентифицирован
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Если роль не совпадает
    if (allowedRole && user?.role !== allowedRole) {
        const redirectPath = user?.role === 'admin' ? '/admin' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // 4. Если все проверки пройдены
    return children;
};