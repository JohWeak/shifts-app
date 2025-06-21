// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleInfo.js
import React from 'react';
import {Row, Col, Button} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {formatScheduleDate} from 'shared/lib/utils/scheduleUtils';
import './ScheduleInfo.css';
import {setActiveTab, setSelectedScheduleId} from "../../model/scheduleSlice";
import {useDispatch} from "react-redux";

const ScheduleInfo = ({schedule, positions = []}) => {
    const {t} = useI18n();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleBackClick = () => {
        dispatch(setActiveTab('overview'));
        dispatch(setSelectedScheduleId(null));
    };

    return (
        <Row className="schedule-info-row align-items-center">
            <Col xs="auto">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleBackClick}
                    className="back-button"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    {t('common.back')}
                </Button>
            </Col>
            <Col>
                <Row className="schedule-info-grid">
                    <Col md={3}>
                        <div className="info-item">
                            <div className="info-label">{t('schedule.week')}</div>
                            <div className="info-value">
                                <i className="bi bi-calendar-week me-2"></i>
                                {formatScheduleDate(schedule.start_date)}
                            </div>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="info-item">
                            <div className="info-label">{t('schedule.site')}</div>
                            <div className="info-value">
                                <i className="bi bi-building me-2"></i>
                                {schedule.workSite?.site_name || schedule.site?.site_name || '-'}
                            </div>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="info-item">
                            <div className="info-label">{t('schedule.status')}</div>
                            <div className="info-value">
                                <StatusBadge status={schedule.status}/>
                            </div>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="info-item">
                            <div className="info-label">{t('position.positions')}</div>
                            <div className="info-value">
                                <i className="bi bi-people me-2"></i>
                                {positions.length}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default ScheduleInfo;