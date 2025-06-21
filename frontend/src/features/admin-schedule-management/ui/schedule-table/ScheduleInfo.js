// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleInfo.js
import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import './ScheduleInfo.css';

const ScheduleInfo = ({ schedule, positions }) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="schedule-info-container">
            {/* Header with back button and title */}
            <div className="schedule-info-header">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate('/admin/schedules')}
                    className="back-button"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    {t('common.back')}
                </Button>
                <h5 className="schedule-info-title mb-0">
                    {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                </h5>
            </div>

            {/* Compact info grid */}
            <div className="schedule-info-grid">
                <div className="info-item">
                    <span className="info-label">{t('site.workSite')}</span>
                    <span className="info-value">
                        <i className="bi bi-geo-alt me-1"></i>
                        {schedule.workSite?.site_name || schedule.site?.site_name || '-'}
                    </span>
                </div>

                <div className="info-item">
                    <span className="info-label">{t('schedule.status')}</span>
                    <StatusBadge status={schedule.status} />
                </div>

                <div className="info-item">
                    <span className="info-label">{t('position.positions')}</span>
                    <span className="info-value">
                        <i className="bi bi-people me-1"></i>
                        {positions.length}
                    </span>
                </div>

                <div className="info-item">
                    <span className="info-label">{t('schedule.created')}</span>
                    <span className="info-value">
                        <i className="bi bi-calendar-check me-1"></i>
                        {formatDate(schedule.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ScheduleInfo;