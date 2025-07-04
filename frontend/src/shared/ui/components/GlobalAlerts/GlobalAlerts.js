// frontend/src/shared/ui/components/GlobalAlerts/GlobalAlerts.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, Spinner } from 'react-bootstrap';
import { removeNotification } from 'app/model/notificationsSlice';
import './GlobalAlerts.css';

const GlobalAlerts = () => {
    const dispatch = useDispatch();
    const notifications = useSelector((state) => state.notifications.notifications);

    return (
        <div className="global-alerts-container">
            {notifications.map((notification) => (
                // 👇 --- ИЗМЕНЕНИЕ ЗДЕСЬ --- 👇
                // Мы создаем уникальный ключ из ID и счетчика обновлений.
                // Когда updateCount меняется, ключ тоже меняется, и React
                // перемонтирует компонент AlertItem, запуская анимацию заново.
                <AlertItem
                    key={`${notification.id}-${notification.updateCount}`}
                    notification={notification}
                />
            ))}
        </div>
    );
};

const AlertItem = ({ notification }) => {
    const dispatch = useDispatch();
    const [isClosing, setIsClosing] = useState(false);
    const animationDuration = 300;
    const isManuallyClosable = notification.variant !== 'info' && notification.variant !== 'success';

    useEffect(() => {
        let timer;
        // Устанавливаем таймер на удаление, если указана длительность
        if (notification.duration && !isClosing) {
            timer = setTimeout(() => {
                // НЕ удаляем сразу, а запускаем анимацию закрытия
                handleClose();
            }, notification.duration);
        }

        // Очищаем таймер при размонтировании или изменении
        return () => clearTimeout(timer);
    }, [notification.duration, isClosing]); // Зависим от isClosing, чтобы не создавать таймер заново

    const handleClose = () => {
        setIsClosing(true); // Запускаем анимацию

        // Удаляем уведомление из Redux ПОСЛЕ завершения анимации
        setTimeout(() => {
            dispatch(removeNotification(notification.id));
        }, animationDuration);
    };

    const isUpdated = notification.updateCount > 0;

    return (
        <Alert
            variant={notification.variant}
            onClose={handleClose}
            dismissible={isManuallyClosable}
            className={`global-alert-item ${isUpdated ? 'updated' : ''} ${isClosing ? 'closing' : ''}`}
        >
            {notification.variant === 'info' && (
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                />
            )}
            {notification.message}
        </Alert>
    );
}

export default GlobalAlerts;