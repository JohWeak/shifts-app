// frontend/src/features/employee-schedule/ui/ScheduleHeaderCard/index.js
import React from 'react';
import {Badge, Card, Form} from 'react-bootstrap';
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
    const shouldRenderFooter = site || position || empName || showNameToggle;

    return (
        <Card className={`schedule-info-card ${className}`}>
            <Card.Body className="pb-1">
                <div className="d-flex justify-content-between align-items-center">
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
                {shouldRenderFooter && (
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top">
                        {showSubtitle && (
                            <small className="d-flex gap-2 text-muted ">
                                {site && (
                                    <span className="d-block">
                                    <i className="bi bi-building me-1"></i>
                                        {site}
                                </span>
                                )}
                                {position && (
                                    <span className="d-block">
                                    <i className="bi bi-person-badge ms-1 me-1"></i>
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
                )}

            </Card.Body>
        </Card>
    );
};