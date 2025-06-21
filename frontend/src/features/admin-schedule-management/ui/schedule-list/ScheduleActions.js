// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleActions.js
import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ScheduleActions.css';

const ScheduleActions = ({
                             status,
                             onPublish,
                             onUnpublish,
                             onExport,
                             isExporting
                         }) => {
    const { t } = useI18n();

    return (
        <div className="schedule-actions-container">
            {/* Status action button */}
            <div className="status-action">
                {status === 'draft' ? (
                    <Button
                        variant="success"
                        size="sm"
                        onClick={onPublish}
                        className="publish-btn"
                    >
                        <i className="bi bi-check-circle me-2"></i>
                        {t('schedule.publish')}
                    </Button>
                ) : (
                    <Button
                        variant="warning"
                        size="sm"
                        onClick={onUnpublish}
                        className="unpublish-btn"
                    >
                        <i className="bi bi-pencil-square me-2"></i>
                        {t('schedule.unpublishEdit')}
                    </Button>
                )}
            </div>

            {/* Export button */}
            <div className="export-action">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onExport('pdf')}
                    disabled={isExporting}
                    className="export-btn"
                    title={t('schedule.exportSchedule')}
                >
                    {isExporting ? (
                        <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            {t('common.loading')}
                        </>
                    ) : (
                        <>
                            <i className="bi bi-upload me-2"></i>
                            {t('schedule.export')}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default ScheduleActions;