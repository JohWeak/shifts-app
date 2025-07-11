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
                                       showNameToggle = false}) => {

    const { t } = useI18n();
    const [showFirstNameOnly, setShowFirstNameOnly] = useState(() => {
        const saved = localStorage.getItem('employee_showFirstNameOnly');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const handleNameToggle = (checked) => {
        setShowFirstNameOnly(checked);
        localStorage.setItem('employee_showFirstNameOnly', JSON.stringify(checked));
    };
    const showSubtitle = position || site;

    return (
        <Card className={`schedule-info-card mb-3 ${className}`}>
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
                            label={t('employee.showFirstNameOnly')}
                            checked={showFirstNameOnly}
                            onChange={(e) => handleNameToggle(e.target.checked)}
                            className="mt-2 small"
                        />
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};