import React from 'react';
import { Badge, Card } from 'react-bootstrap';
import './PageHeader.css';

/**
 * Universal component for page headers.
 * @param {string} title - Main title.
 * @param {string} [subtitle] - Subtitle (optional).
 * @param {JSX.Element|string} [icon] - Icon. Can be a JSX element or a string with a Bootstrap Icon class.
 * @param {string} [iconColor] - Icon color, if it is passed as a string.
 * @param {object} [badge] - Object for badge: { text: string, variant: string }.
 * @param {JSX.Element} [actions] - Buttons or other elements for the right part of the header.
 * @param {JSX.Element} [children] - Alternative to actions.
 * @param {string} [className] - Additional classes for customization.
 */
const PageHeader = ({
                        title,
                        subtitle,
                        icon,
                        iconColor = 'text-primary',
                        badge,
                        actions,
                        children,
                        className = '',
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