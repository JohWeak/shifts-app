// frontend/src/features/schedule-management/components/ScheduleHeader.js
import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';

const ScheduleHeader = ({ onGenerateClick, onCompareClick, loading }) => {
    const { t } = useI18n();

    return (
        <div className="schedule-header">
            <div className="header-content">
                {/*<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">*/}
                {/*    <div className="mb-3 mb-md-0">*/}
                <h1 className="h3 mb-2 text-dark fw-bold">
                    <i className="bi bi-calendar-week me-2 text-primary"></i>
                    {t('schedule.title')}
                </h1>
                <p className="text-muted mb-0">{t('schedule.subtitle')}</p>
            </div>
            <div className="header-actions">
                <Button
                    variant="outline-primary"
                    onClick={onCompareClick}
                    disabled={loading}
                    className="me-2"
                >
                    {loading ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-speedometer2 me-2"></i>}
                    {t('schedule.compareAlgorithms')}
                </Button>
                <Button
                    variant="primary"
                    onClick={onGenerateClick}
                    disabled={loading}
                >
                    {loading ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-plus-circle me-2"></i>}
                    {t('schedule.generateSchedule')}
                </Button>
            </div>
        </div>
    );
};

export default ScheduleHeader;
