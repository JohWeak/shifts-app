// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleInfo.js
import React from 'react';
import { Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { setActiveTab, setSelectedScheduleId } from '../../model/scheduleSlice';
import './ScheduleInfo.css';

const ScheduleInfo = ({ schedule, positions = [] }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '.');
    };

    const handleBackClick = () => {
        dispatch(setActiveTab('overview'));
        dispatch(setSelectedScheduleId(null));
    };

    return (
        <div className="schedule-info-container">
            {/* Header row with all elements */}
            <h4 className="schedule-title mb-0">
            {t('schedule.scheduleDetails')}
            </h4>
            <div className="schedule-info-header">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleBackClick}
                    className="back-button"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    {t('common.back')}
                </Button>

                <h5 className="schedule-title mb-0">
                    {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                </h5>
            </div>
                <div className="info-items">
                    <div className="info-item">
                        <span className="info-label">{t('schedule.workSite')}</span>
                        <span className="info-value">
                            {schedule.workSite?.site_name || schedule.site?.site_name || '-'}
                        </span>
                    </div>

                    <div className="info-item">
                        <span className="info-label">{t('schedule.status')}</span>
                        <StatusBadge status={schedule.status} size="sm" />
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