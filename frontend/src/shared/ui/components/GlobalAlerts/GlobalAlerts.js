// frontend/src/shared/ui/components/GlobalAlerts/GlobalAlerts.js
import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Alert, Spinner} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {removeNotification} from 'app/model/notificationsSlice';
import './GlobalAlerts.css';

const GlobalAlerts = () => {
    const notifications = useSelector((state) => state.notifications.notifications);
    const {locale} = useI18n();
    const isRTL = locale === 'he';

    return (
        <div className={`global-alerts-container ${isRTL ? 'rtl' : 'ltr'}`}>
            {notifications.map((notification) => (
                <AlertItem
                    key={`${notification.id}-${notification.updateCount || 0}`}
                    notification={notification}
                />
            ))}
        </div>
    );
};

const AlertItem = ({notification}) => {
    const dispatch = useDispatch();
    const [isClosing, setIsClosing] = useState(false);
    const {t} = useI18n();

    // Support both 'variant' and 'type' for backwards compatibility
    const variant = notification.variant || notification.type || 'info';
    const animationDuration = 300;

    // Auto-close for success and info, manual close for warnings and errors
    const isAutoClose = variant === 'success' || variant === 'info';

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            dispatch(removeNotification(notification.id));
        }, animationDuration);
    }, [dispatch, notification.id, setIsClosing, animationDuration]);

    useEffect(() => {
        let timer;
        if (notification.duration && isAutoClose && !isClosing) {
            timer = setTimeout(() => {
                handleClose();
            }, notification.duration);
        }
        return () => clearTimeout(timer);
    }, [notification.duration, isAutoClose, isClosing, handleClose]);


    const getIcon = () => {
        switch (variant) {
            case 'success':
                return 'bi-check-circle-fill';
            case 'error':
            case 'danger':
                return 'bi-x-circle-fill';
            case 'warning':
                return 'bi-exclamation-triangle-fill';
            case 'info':
                return notification.loading ? 'spinner' : 'bi-info-circle-fill';
            default:
                return 'bi-info-circle-fill';
        }
    };

    const icon = getIcon();
    const isUpdated = (notification.updateCount || 0) > 0;

    return (
        <Alert
            variant={variant === 'error' ? 'danger' : variant}
            onClose={!isAutoClose ? handleClose : undefined}
            dismissible={!isAutoClose}
            className={`global-alert-item ${isUpdated ? 'updated' : ''} ${isClosing ? 'closing' : ''}`}
        >
            <div className="alert-content">
                <div className="alert-icon">
                    {icon === 'spinner' ? (
                        <Spinner
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        />
                    ) : (
                        <i className={icon}></i>
                    )}
                </div>
                <div className="alert-message">
                    {typeof notification.message === 'string' && notification.message.includes('.')
                        ? t(notification.message, notification.params || [])
                        : notification.message
                    }
                </div>
            </div>
        </Alert>
    );
};

export default GlobalAlerts;