// frontend/src/features/admin-schedule-management/ui/ScheduleView/index.js
import React from 'react';
import {Button} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {resetScheduleView} from '../../../../model/scheduleSlice';
import ScheduleActionButtons from "../../../ScheduleActionButtons";
import './ScheduleInfo.css';
import {formatWeekRange, formatDate as formatDateUtil } from "shared/lib/utils/scheduleUtils";

const ScheduleInfo = ({
                          schedule,
                          positions = [],
                          onPublish,
                          onUnpublish,
                          onExport,
                          isExporting,
                          scheduleDetails,
                          onAutofill,
                          isAutofilling,
                      }) => {
    const {t, locale} = useI18n();
    const dispatch = useDispatch();
    const {editingPositions, pendingChanges} = useSelector(state => state.schedule);

    // Check if there are any positions being edited or unsaved changes
    const hasUnsavedChanges = Object.values(editingPositions || {}).some(Boolean) ||
        Object.keys(pendingChanges || {}).length > 0;

    const dateFormat = 'DD.MM.YYYY';


    const handleBackClick = () => {
        dispatch(resetScheduleView());
    };


    return (
        <div className="schedule-info-wrapper">

            {/* --- Actions bar  --- */}
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
                    <span>{formatWeekRange(schedule.start_date, locale)}</span>
                </div>
                <div className="main-actions">
                    <ScheduleActionButtons
                        schedule={schedule}
                        variant="buttons"
                        onPublish={onPublish}
                        onUnpublish={onUnpublish}
                        onExport={onExport}
                        isExporting={isExporting}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onAutofill={onAutofill}
                        isAutofilling={isAutofilling}
                    />
                </div>

            </div>
            {/* Info bar */}
            <div className="schedule-info-bar">
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
                        <span className="info-label">{t('schedule.assignments')}</span>
                    </div>
                    <span className="info-value">{scheduleDetails?.assignments?.length}</span>
                </div>
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-calendar-check"></i>
                        <span className="info-label">{t('schedule.created')}</span>
                    </div>
                    <span className="info-value">{formatDateUtil(schedule.createdAt, dateFormat)}</span>
                </div>
                <div className="info-item">
                    <div className="info-item-header">
                        <i className="bi bi-pencil-square"></i>
                        <span className="info-label">{t('schedule.updated')}</span>
                    </div>
                    <span className="info-value">{formatDateUtil(schedule.updatedAt, dateFormat)}</span>
                </div>

            </div>
        </div>
    );
};

export default ScheduleInfo;