// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleInfo.js
import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatScheduleDate } from 'shared/lib/utils/scheduleUtils';
import './ScheduleInfo.css';

const ScheduleInfo = ({ schedule, positions = [] }) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/admin/schedules');
    };

    return (
        <div className="schedule-info-container">
            <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleBackClick}
                className="back-button mb-3"
            >
                <i className="bi bi-arrow-left me-2"></i>
                {t('common.back')}
            </Button>

            <Row className="schedule-info-grid">
                <Col md={3}>
                    <div className="info-item">
                        <div className="info-label">{t('schedule.week')}</div>
                        <div className="info-value">
                            <i className="bi bi-calendar-week"></i>
                            {formatScheduleDate(schedule.start_date)}
                        </div>
                    </div>
                </Col>
                <Col md={3}>
                    <div className="info-item">
                        <div className="info-label">{t('schedule.site')}</div>
                        <div className="info-value">
                            <i className="bi bi-building"></i>
                            {schedule.workSite?.site_name || schedule.site?.site_name || '-'}
                        </div>
                    </div>
                </Col>
                <Col md={3}>
                    <div className="info-item">
                        <div className="info-label">{t('schedule.status')}</div>
                        <div className="info-value">
                            <StatusBadge status={schedule.status} />
                        </div>
                    </div>
                </Col>
                <Col md={3}>
                    <div className="info-item">
                        <div className="info-label">{t('position.positions')}</div>
                        <div className="info-value">
                            <i className="bi bi-people"></i>
                            {positions.length}
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ScheduleInfo;