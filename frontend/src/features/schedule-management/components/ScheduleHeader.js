// frontend/src/features/schedule-management/components/ScheduleHeader.js
import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';
import './ScheduleHeader.css';

const ScheduleHeader = ({ onGenerateClick, onCompareClick, loading }) => {
    const { t } = useI18n();

    return (
        <div className="schedule-header">
            <div className="header-content">
                <div className="d-flex align-items-start">
                    <i className="bi bi-calendar-week me-2 text-primary fs-3"></i>
                    <div>
                        <h1 className="h3 mb-2 text-dark fw-bold">
                            {t('schedule.title')}
                        </h1>
                        <p className="text-muted mb-0">{t('schedule.subtitle')}</p>
                    </div>
                </div>
            </div>
            <div className="header-actions">
                <Button
                    variant="outline-primary"
                    onClick={onCompareClick}
                    disabled={loading}
                    className="d-flex align-items-center"
                >
                    {loading ? (
                        <Spinner size="sm" className="me-2" />
                    ) : (
                        <i className="bi bi-speedometer2 me-2"></i>
                    )}
                    <span>{t('schedule.compareAlgorithms')}</span>
                </Button>
                <Button
                    variant="primary"
                    onClick={onGenerateClick}
                    disabled={loading}
                    className="d-flex align-items-center"
                >
                    {loading ? (
                        <Spinner size="sm" className="me-2" />
                    ) : (
                        <i className="bi bi-plus-circle me-2"></i>
                    )}
                    <span>{t('schedule.generateSchedule')}</span>
                </Button>
            </div>
        </div>
    );
};

export default ScheduleHeader;