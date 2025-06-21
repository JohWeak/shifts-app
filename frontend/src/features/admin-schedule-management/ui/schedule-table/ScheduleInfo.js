// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleInfo.js
import React from 'react';
import { Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { setActiveTab, setSelectedScheduleId } from '../../model/scheduleSlice';
import ScheduleActions from '../schedule-list/ScheduleActions';
import './ScheduleInfo.css';

const ScheduleInfo = ({ schedule, positions = [], onPublish, onUnpublish, onExport, isExporting }) => {
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

    // Debug log to see what we're getting
    console.log('Schedule object:', schedule);
    console.log('WorkSite:', schedule.workSite);

    return (
        <div className="schedule-info-wrapper">
            {/* Title */}
            <h5 className="schedule-details-title">{t('schedule.scheduleDetails')}</h5>

            {/* Date range with icon */}
            <div className="schedule-date-range">
                <i className="bi bi-calendar-range"></i>
                <span>{formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}</span>
            </div>

            {/* Info bar */}
            <div className="schedule-info-bar">
                <div className="info-item">
                    <i className="bi bi-geo-alt"></i>
                    <div className="info-content">
                        <span className="info-label">{t('site.workSite')}</span>
                        <span className="info-value">
                            {schedule.workSite?.site_name || '-'}
                        </span>
                    </div>
                </div>

                <div className="info-item">
                    <i className="bi bi-flag"></i>
                    <div className="info-content">
                        <span className="info-label">{t('schedule.status')}</span>
                        <StatusBadge status={schedule.status} size="sm" />
                    </div>
                </div>

                <div className="info-item">
                    <i className="bi bi-people"></i>
                    <div className="info-content">
                        <span className="info-label">{t('position.positions')}</span>
                        <span className="info-value">{positions.length}</span>
                    </div>
                </div>

                <div className="info-item">
                    <i className="bi bi-calendar-check"></i>
                    <div className="info-content">
                        <span className="info-label">{t('schedule.created')}</span>
                        <span className="info-value">{formatDate(schedule.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Actions bar */}
            <div className="schedule-actions-bar">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleBackClick}
                    className="back-button"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    {t('common.back')}
                </Button>

                <div className="action-buttons-group">
                    <ScheduleActions
                        status={schedule.status}
                        onPublish={onPublish}
                        onUnpublish={onUnpublish}
                        onExport={onExport}
                        isExporting={isExporting}
                    />
                </div>
            </div>
        </div>
    );
};

export default ScheduleInfo;