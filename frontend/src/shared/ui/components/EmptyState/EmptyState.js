import React from 'react';
import { Card, Button } from 'react-bootstrap';
import './EmptyState.css';

const EmptyState = ({ icon, title, description, actionLabel, onAction }) => {
    return (
        <Card className="empty-state">
            <Card.Body className="text-center py-5">
                {icon && <div className="empty-state-icon mb-3">{icon}</div>}
                {title && <h4 className="empty-state-title mb-2">{title}</h4>}
                {description && <p className="empty-state-description text-muted mb-4">{description}</p>}
                {actionLabel && onAction && (
                    <Button variant="primary" onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

export default EmptyState;