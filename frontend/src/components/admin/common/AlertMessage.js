// frontend/src/components/admin/common/AlertMessage.js
import React from 'react';
import { Alert } from 'react-bootstrap';

export const AlertMessage = ({
                                 alert,
                                 onClose,
                                 className = "mb-4 d-flex align-items-start"
                             }) => {
    if (!alert) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'info': return 'info-circle';
            case 'warning': return 'exclamation-triangle';
            case 'danger': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    };

    return (
        <Alert
            variant={alert.type || 'info'}
            className={className}
            dismissible={!!onClose}
            onClose={onClose}
        >
            <i className={`bi bi-${getIcon(alert.type)} me-2`}></i>
            <div>{alert.message}</div>
        </Alert>
    );
};

export default AlertMessage;