import React from 'react';
import { Alert } from 'react-bootstrap';
import { useI18n } from '../../../lib/i18n/i18nProvider';

const ErrorMessage = ({ error, onClose, variant = 'danger' }) => {
    const { t } = useI18n();

    if (!error) return null;

    const message = typeof error === 'string' ? error : error.message || t('errors.unexpectedError');

    return (
        <Alert variant={variant} dismissible onClose={onClose}>
            <Alert.Heading>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {t('common.error')}
            </Alert.Heading>
            <p className="mb-0">{message}</p>
        </Alert>
    );
};

export default ErrorMessage;