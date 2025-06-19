import React from 'react';
import { Badge } from 'react-bootstrap';
import { useI18n } from '../../../lib/i18n/i18nProvider';
import './StatusBadge.css';

const StatusBadge = ({ status, size = 'md' }) => {
    const { t } = useI18n();

    const variants = {
        published: 'success',
        draft: 'warning',
        archived: 'secondary',
        active: 'primary',
        inactive: 'danger'
    };

    const sizeClasses = {
        sm: 'badge-sm',
        md: '',
        lg: 'badge-lg'
    };

    return (
        <Badge
            bg={variants[status] || 'secondary'}
            className={sizeClasses[size]}
        >
            {t(`schedule.${status}`)}
        </Badge>
    );
};

export default StatusBadge;