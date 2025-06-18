import React from 'react';
import { Row, Col } from 'react-bootstrap';
import StatusBadge from '../../../../shared/ui/components/StatusBadge/StatusBadge';
import { useI18n } from '../../../../shared/lib/i18n/i18nProvider';
import { formatScheduleDate } from '../../../../shared/lib/utils/scheduleUtils';

const ScheduleInfo = ({ schedule, positions = [] }) => {
    const { t } = useI18n();

    return (
        <Row className="mb-4">
            <Col md={3}>
                <div className="text-muted small">{t('schedule.week')}</div>
                <div className="fw-bold">{formatScheduleDate(schedule.start_date)}</div>
            </Col>
            <Col md={3}>
                <div className="text-muted small">{t('schedule.site')}</div>
                <div className="fw-bold">{schedule.site?.site_name || '-'}</div>
            </Col>
            <Col md={3}>
                <div className="text-muted small">{t('schedule.status')}</div>
                <div><StatusBadge status={schedule.status} /></div>
            </Col>
            <Col md={3}>
                <div className="text-muted small">{t('position.positions')}</div>
                <div className="fw-bold">{positions.length}</div>
            </Col>
        </Row>
    );
};

export default ScheduleInfo;