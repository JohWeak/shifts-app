import React from 'react';
import {Card, Badge} from 'react-bootstrap';
import './PageHeader.css';

/**
 * Универсальный компонент для заголовков страниц.
 * @param {string} title - Главный заголовок.
 * @param {string} [subtitle] - Подзаголовок (опционально).
 * @param {JSX.Element|string} [icon] - Иконка. Может быть JSX-элементом или строкой с классом Bootstrap Icon.
 * @param {string} [iconColor] - Цвет иконки, если она передана как строка.
 * @param {object} [badge] - Объект для бейджа: { text: string, variant: string }.
 * @param {JSX.Element} [actions] - Кнопки или другие элементы для правой части заголовка.
 * @param {JSX.Element} [children] - Альтернатива actions.
 * @param {string} [className] - Дополнительные классы для кастомизации.
 */
const PageHeader = ({
                        title,
                        subtitle,
                        icon,
                        iconColor = 'text-primary',
                        badge,
                        actions,
                        children,
                        className = ''
                    }) => {

    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return <i className={`bi bi-${icon} me-2 ${iconColor} fs-3 align-middle`}></i>;
        }
        return <span className="me-2 align-middle">{icon}</span>;
    };

    return (
        <Card className="page-header-card mb-2 mb-md-3">
            <Card.Body>
                <div className={`page-header ${className}`}>
                    <div className="page-header-content">
                        <div className="page-header-text">
                            <h1 className="h3 mb-2 ">
                                {renderIcon()}
                                {title}
                            </h1>
                            {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
                        </div>
                        {badge && (
                            <Badge
                                bg={badge.variant || 'secondary'}
                                className="ms-2 align-middle page-header-badge "
                            >
                                {badge.text}
                            </Badge>
                        )}
                        {(actions || children) && (
                            <div className="page-header-actions">
                                {actions || children}
                            </div>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default PageHeader;