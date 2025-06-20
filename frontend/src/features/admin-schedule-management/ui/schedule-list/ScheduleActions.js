import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import './ScheduleActions.css';

const ScheduleActions = ({
                             status,
                             onPublish,
                             onUnpublish,
                             onExport,
                             isExporting
                         }) => {
    const {t} = useI18n();

    return (
        <div className="schedule-actions">
            <ButtonGroup>
                {status === 'draft' ? (
                    <Button variant="success" size="sm" onClick={onPublish}>
                        <i className="bi bi-check-circle me-2"></i>
                        {t('schedule.publish')}
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
                    title={t('schedule.exportSchedule')}
                >
                    <i className="bi bi-download me-2"></i>

                </Button>
            </ButtonGroup>
        </div>

    );
};

export default ScheduleActions;