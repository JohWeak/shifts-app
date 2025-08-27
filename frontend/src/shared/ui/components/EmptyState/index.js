// frontend/src/shared/ui/components/index.js

import React from 'react';
import { Button } from 'react-bootstrap';
import './EmptyState.css';

/**
 * Универсальный компонент для отображения "пустых состояний".
 * @param {JSX.Element|string} icon - Иконка. Может быть JSX-элементом или строкой с CSS-классом (напр., 'bi-inbox').
 * @param {string} title - Заголовок.
 * @param {string} description - Описание.
 * @param {string} actionLabel - Текст на кнопке действия.
 * @param {function} onAction - Функция, вызываемая при нажатии на кнопку.
 * @param {'primary'|'secondary'} variant - Цветовая схема компонента.
 */
const EmptyState = ({ icon, title, description, actionLabel, onAction, variant = 'primary' }) => {

    // "Умный" рендеринг иконки
    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return <i className={`bi ${icon}`}></i>;
        }
        return icon;
    };

    return (
        <div className={`empty-state-card variant-${variant}`}>
            <div className="empty-state-content">
                {icon && (
                    <div className="empty-state-icon-background">
                        {renderIcon()}
                    </div>
                )}
                {title && (
                    <h4 className="empty-state-title">
                        {title}
                    </h4>
                )}
                {description && (
                    <p className="empty-state-description text-muted">
                        {description}
                    </p>
                )}
                {actionLabel && onAction && (
                    <Button
                        variant={variant}
                        onClick={onAction}
                        className="mt-3">
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;