// frontend/src/components/admin/schedule/ScheduleActions.js
import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';

const ScheduleActions = ({
                             onGenerateSchedule,
                             onCompareAlgorithms,
                             loading = false
                         }) => {
    const messages = useMessages('en');

    return (
        <div className="d-flex gap-2 mb-3">
            <Button
                variant="primary"
                onClick={onGenerateSchedule}
                disabled={loading}
                className="d-flex align-items-center"
            >
                <i className="bi bi-plus-circle me-2"></i>
                {messages.GENERATE_SCHEDULE}
            </Button>

            <Button
                variant="outline-secondary"
                onClick={onCompareAlgorithms}
                disabled={loading}
                className="d-flex align-items-center"
            >
                <i className="bi bi-bar-chart me-2"></i>
                {messages.COMPARE_ALGORITHMS}
            </Button>
        </div>
    );
};

export default ScheduleActions;