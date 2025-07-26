// frontend/src/shared/ui/components/StatusBadge/StatusBadge.js
import React from 'react';
import { Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './StatusBadge.css';

// Добавляем новый проп `mode` со значением по умолчанию 'text'
const StatusBadge = ({
                         status,
                         size = 'md',
                         mode = 'text',
                         variant,  //  для кастомного варианта
                         text,     // для кастомного текста
                         statusText // Для обратной совместимости
                     }) => {
    const { t } = useI18n();

    // Определяем, какой цвет соответствует какому статусу
    const defaultVariants = {
        published: 'success',
        draft: 'warning',
        archived: 'secondary',

        active: 'primary',
        inactive: 'danger',

        pending: 'warning',
        approved: 'success',
        rejected: 'danger'
    };

    const icons = {
        published: 'bi bi-check-lg',
        draft: 'bi bi-pencil-fill',
        archived: 'bi bi-archive-fill',

        active: 'bi bi-play-circle-fill',
        inactive: 'bi bi-x-circle-fill',

        pending: 'bi bi-clock-fill',
        approved: 'bi bi-check-circle-fill',
        rejected: 'bi bi-x-circle-fill'
    };

    const sizeClasses = {
        sm: 'badge-sm',
        md: '',
        lg: 'badge-lg'
    };

    const displayText = text || statusText || t(`schedule.${status}`, { defaultValue: status });
    const badgeVariant = variant || defaultVariants[status] || 'secondary';

    return (
        <Badge
            bg={badgeVariant}
            className={`${sizeClasses[size]} status-badge`}
            title={displayText}
        >
            {mode === 'icon' ? (
                <i className={`${icons[status] || 'bi bi-question-circle-fill'}`}></i>
            ) : (
                displayText
            )}
        </Badge>
    );
};

export default StatusBadge;