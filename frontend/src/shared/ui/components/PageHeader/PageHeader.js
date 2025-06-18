import React from 'react';
import './PageHeader.css';
import {Card} from "react-bootstrap";

const PageHeader = ({
                        title,
                        subtitle,
                        icon,
                        iconColor = 'text-primary',
                        actions,
                        children,
                        className = ''
                    }) => {
    return (
        <Card className="page-header-card mb-3">
            <Card.Body>
                <div className={`page-header ${className}`}>
                    <div className="page-header-content">
                        <div className="page-header-text">
                            <h1 className="h3 mb-2 text-dark fw-bold">
                                {icon && <i className={`bi bi-${icon} me-2 ${iconColor} fs-3`}></i>}
                                {title}
                            </h1>
                            {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
                        </div>
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