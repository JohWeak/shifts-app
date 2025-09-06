// frontend/src/features/employee-schedule/ui/WeekEmptyState/index.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './WeekEmptyState.css';

const WeekEmptyState = ({ weekTitle, variant = 'current' }) => {
    const { t } = useI18n();

    const getMessage = () => {
        if (variant === 'current') {
            return t('employee.schedule.noScheduleForThisWeek');
        } else if (variant === 'next') {
            return t('employee.schedule.noScheduleNextWeek');
        }
        return t('employee.schedule.noSchedule');
    };

    return (
        <Card className="week-empty-state-card mb-4">
            <Card.Header className="week-empty-header">
                <h6 className="mb-0 fw-bold">{weekTitle}</h6>
            </Card.Header>
            <Card.Body className="week-empty-body text-center py-3">
                <div className="week-empty-icon mb-2">
                    <i className="bi bi-calendar-x text-muted"></i>
                </div>
                <p className="mb-0 text-muted small">
                    {getMessage()}
                </p>
            </Card.Body>
        </Card>
    );
};

export default WeekEmptyState;