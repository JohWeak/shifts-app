// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleInfo.js
import React from 'react';
import {Button, Col, Row} from 'react-bootstrap';
import {useDispatch} from 'react-redux';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {setActiveTab, setSelectedScheduleId} from '../../model/scheduleSlice';
import ScheduleActions from '../schedule-list/ScheduleActions';
import './ScheduleInfo.css';

const ScheduleInfo = ({schedule, positions = [], onPublish, onUnpublish, onExport, isExporting}) => {
    const {t} = useI18n();
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


    console.log('Schedule fields:', Object.keys(schedule || {}));

// Может быть алгоритм в другом месте?
    const algorithm = schedule?.algorithm ||
        schedule?.generation_algorithm ||
        schedule?.algo ||
        schedule?.method ||
        '-';


    return (
        <div className="schedule-info-wrapper">

            {/* --- Actions bar (NEW STRUCTURE) --- */}
            <div className="schedule-actions-bar">
                <div className="back-action">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleBackClick}
                        className="back-button"
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        {t('schedule.backToSchedules') || 'Back to Schedules'}
                    </Button>
                </div>
                <div className="schedule-date-range">
                    {t('schedule.week')}
                    <span>{formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}</span>
                </div>
                <div className="main-actions">
                    <ScheduleActions
                        status={schedule.status}
                        onPublish={onPublish}
                        onUnpublish={onUnpublish}
                        onExport={onExport}
                        isExporting={isExporting}
                    />
                </div>

            </div>
            {/* Info bar */}
            <div className="schedule-info-bar">
                {/* ... ваши info-item ... */}
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-geo-alt"></i>
                        <span className="info-label">{t('site.workSite')}</span>
                    </div>
                    <span className="info-value">
                        {schedule.work_site?.site_name || '-'}
                    </span>
                </div>
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-flag"></i>
                        <span className="info-label">{t('schedule.status')}</span>
                    </div>
                    <StatusBadge status={schedule.status} size="sm"/>
                </div>
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-people"></i>
                        <span className="info-label">{t('position.positions')}</span>
                    </div>
                    <span className="info-value">{positions.length}</span>
                </div>
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-gear"></i>
                        <span className="info-label">{t('modal.compareAlgorithms.algorithm')}</span>
                    </div>
                    <span className="info-value">{algorithm}</span>
                </div>
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-calendar-check"></i>
                        <span className="info-label">{t('schedule.created')}</span>
                    </div>
                    <span className="info-value">{formatDate(schedule.createdAt)}</span>
                </div>
            </div>
        </div>
    );
};

export default ScheduleInfo;