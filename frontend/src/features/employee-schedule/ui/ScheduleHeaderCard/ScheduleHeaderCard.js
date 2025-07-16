//frontend/src/features/employee-schedule/ui/ScheduleHeaderCard/ScheduleHeaderCard.js
import React, {useState, useEffect} from 'react';
import {Card, Badge, Form, Col, Row} from 'react-bootstrap';
import {formatWeekRange} from 'shared/lib/utils/scheduleUtils';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import './ScheduleHeaderCard.css';

export const ScheduleHeaderCard = ({
                                       title,
                                       position,
                                       site,
                                       week,
                                       className = '',
                                       empName = '',
                                       showNameToggle = false,
                                       showFullName,
                                       onNameToggle,
                                   }) => {

    const {t, direction, locale} = useI18n();
    const showSubtitle = position || site;

    return (
        <Card className={`schedule-info-card mb-2 ${className}`}>
            <Card.Body className=" py-2">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2">
                    <div>
                        {title && (
                            <h6 className="week-title">
                                {title}
                            </h6>)}
                    </div>
                    <div>
                        {week && (
                            <Badge bg="primary mb-2">
                                {formatWeekRange(week, locale)}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="d-flex justify-content-between">
                    {showSubtitle && (
                        <small className="d-flex flex-column gap-1 text-muted">
                            {site && (
                                <span className="d-block">
                                    <i className="bi bi-building me-1"></i>
                                    {site}
                                </span>
                            )}
                            {position && (
                                <span className="d-block">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {position}
                                </span>
                            )}
                        </small>
                    )}
                    <div>
                        {empName && (
                            <span className="fw-semibold">{empName}</span>
                        )}
                        {showNameToggle && (
                            <Form.Check
                                type="switch"
                                id="name-display-toggle"
                                label={t('employee.showFullName')}
                                checked={showFullName}
                                onChange={(e) => onNameToggle(e.target.checked)}
                                className="mt-1 me-1 text-muted"
                                reverse={direction === 'ltr'}
                            />
                        )}
                    </div>
                </div>

            </Card.Body>
        </Card>
    );
};