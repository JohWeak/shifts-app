// frontend/src/features/admin-dashboard/components/MetricCard/MetricCard.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './MetricCard.css';

/**
 * Reusable metric card component for dashboard
 * Displays a metric with icon, value, label and optional trend
 */
const MetricCard = ({
                        icon,
                        value,
                        label,
                        color = 'primary',
                        trend = null,
                        onClick = null,
                        loading = false
                    }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            if (typeof onClick === 'string') {
                navigate(onClick);
            } else {
                onClick();
            }
        }
    };

    return (
        <Card
            className={`metric-card metric-${color} ${onClick ? 'clickable' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleClick}
        >
            <Card.Body className="d-flex align-items-center">
                <div className="metric-icon-wrapper">
                    <div className={`metric-icon bg-${color} bg-opacity-10`}>
                        {loading ? (
                            <div className="spinner-border spinner-border-sm text-primary" />
                        ) : (
                            <i className={`bi ${icon} text-${color}`} />
                        )}
                    </div>
                </div>

                <div className="metric-content flex-grow-1">
                    <div className="metric-value">
                        {loading ? '...' : value}
                    </div>
                    <div className="metric-label">
                        {label}
                    </div>
                    {trend && !loading && (
                        <div className={`metric-trend text-${trend > 0 ? 'success' : 'danger'}`}>
                            <i className={`bi bi-arrow-${trend > 0 ? 'up' : 'down'}-short`} />
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>

                {onClick && (
                    <div className="metric-arrow">
                        <i className="bi bi-chevron-right" />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default MetricCard;