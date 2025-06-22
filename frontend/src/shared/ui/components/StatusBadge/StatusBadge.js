// frontend/src/shared/ui/components/StatusBadge/StatusBadge.js
import React from 'react';
import { Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './StatusBadge.css';

// Добавляем новый проп `mode` со значением по умолчанию 'text'
const StatusBadge = ({ status, size = 'md', mode = 'text' }) => {
    const { t } = useI18n();

    // Определяем, какой цвет соответствует какому статусу
    const variants = {
        published: 'success',
        draft: 'warning',
        archived: 'secondary',
        active: 'primary',
        inactive: 'danger'
    };

    // НОВОЕ: Определяем, какая иконка соответствует какому статусу
    const icons = {
        published: 'bi bi-check-circle-fill',
        draft: 'bi bi-pencil-fill',
        archived: 'bi bi-archive-fill',
        active: 'bi bi-play-circle-fill',
        inactive: 'bi bi-x-circle-fill'
    };

    const sizeClasses = {
        sm: 'badge-sm',
        md: '',
        lg: 'badge-lg'
    };

    const statusText = t(`schedule.${status}`, { defaultValue: status });

    return (
        <Badge
            bg={variants[status] || 'secondary'}
            className={`${sizeClasses[size]} status-badge`}
            // Для доступности добавляем title, который покажет текст статуса при наведении
            title={statusText}
        >
            {/* Условный рендеринг: показываем иконку или текст */}
            {mode === 'icon' ? (
                <i className={`${icons[status] || 'bi bi-question-circle-fill'}`}></i>
            ) : (
                statusText
            )}
        </Badge>
    );
};

export default StatusBadge;