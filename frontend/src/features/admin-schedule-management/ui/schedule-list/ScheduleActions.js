import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const ScheduleActions = ({
                             status,
                             onPublish,
                             onUnpublish,
                             onExport,
                             isExporting
                         }) => {
    const { t } = useI18n();

    return (
        <ButtonGroup>
            {status === 'draft' ? (
                <Button variant="success" size="sm" onClick={onPublish}>
                    <i className="bi bi-check-circle me-2"></i>
                    {t('schedule.publishSchedule')}
                </Button>
            ) : (
                <Button variant="warning" size="sm" onClick={onUnpublish}>
                    <i className="bi bi-pencil-square me-2"></i>
                    {t('schedule.unpublishEdit')}
                </Button>
            )}
            <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onExport('pdf')}
                disabled={isExporting}
            >
                <i className="bi bi-download me-2"></i>
                {t('schedule.exportSchedule')}
            </Button>
        </ButtonGroup>
    );
};

export default ScheduleActions;