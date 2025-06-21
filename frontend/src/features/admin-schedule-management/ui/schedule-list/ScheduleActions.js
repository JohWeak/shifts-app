// frontend/src/features/admin-schedule-management/ui/schedule-list/ScheduleActions.js
import React from 'react';
import { Button } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import ExportDropdown from './ExportDropdown';
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
        <div className="schedule-actions">
            {status === 'draft' ? (
                <Button
                    variant="success"
                    size="sm"
                    onClick={onPublish}
                    className="action-button"
                >
                    <i className="bi bi-check-circle me-2"></i>
                    {t('schedule.publish')}
                </Button>
            ) : (
                <Button
                    variant="warning"
                    size="sm"
                    onClick={onUnpublish}
                    className="action-button"
                >
                    <i className="bi bi-pencil-square me-2"></i>
                    {t('schedule.unpublishEdit')}
                </Button>
            )}

            <ExportDropdown
                onExport={onExport}
                isExporting={isExporting}
                size="sm"
            />
        </div>
    );
};

export default ScheduleActions;