//frontend/src/features/employee-schedule/ui/ScheduleHeaderCard/ScheduleHeaderCard.js
import React, { useState, useEffect } from 'react';
import {Card, Badge, Form} from 'react-bootstrap';
import {formatWeekRange} from 'shared/lib/utils/scheduleUtils';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ScheduleHeaderCard.css';


// Пропсы:
// - title: Основной заголовок (имя сотрудника или должность)
// - position: Название должности для подзаголовка
// - site: Название объекта для подзаголовка
// - week: Объект недели для бейджа
// - className: Дополнительные классы для Card

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

    const { t } = useI18n();
    const showSubtitle = position || site;

    return (
        <Card className={`schedule-info-card mb-2 ${className}`}>
            <Card.Body className="d-flex justify-content-between py-2">
                <div className="d-flex flex-column align-items-start gap-1">
                    {title && <h6 className="mb-0">{title}</h6>}
                    {showSubtitle && (
                        <small className="text-muted">
                            {position && (
                                <span className="d-block">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {position}
                                </span>
                            )}
                            {site && (
                                <span className="d-block">
                                    <i className="bi bi-building me-1"></i>
                                    {site}
                                </span>
                            )}
                        </small>
                    )}
                </div>
                <div className="d-flex flex-column align-items-end justify-content-center">
                    {week && (
                        <Badge bg="primary mt-1">
                            {formatWeekRange(week)}
                        </Badge>
                    )}
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
                            className="mt-1 text-muted w-100"
                        />
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};