import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { formatWeekRange } from 'shared/lib/utils/scheduleUtils';

// Пропсы:
// - title: Основной заголовок (имя сотрудника или должность)
// - position: Название должности для подзаголовка
// - site: Название объекта для подзаголовка
// - week: Объект недели для бейджа
// - className: Дополнительные классы для Card

export const ScheduleHeaderCard = ({ title, position, site, week, className = '' }) => {
    const showSubtitle = position || site;

    return (
        <Card className={`schedule-info-card mb-3 ${className}`}>
            <Card.Body className="d-flex justify-content-between align-items-center py-2">
                <div>
                    {title && <h6 className="mb-0">{title}</h6>}
                    {showSubtitle && (
                        <small className="text-muted">
                            {position && (
                                <>
                                    <i className="bi bi-person-badge me-1"></i>
                                    {position}
                                </>
                            )}
                            {position && site && ' • '}
                            {site && (
                                <>
                                    <i className="bi bi-building me-1"></i>
                                    {site}
                                </>
                            )}
                        </small>
                    )}
                </div>
                {week && (
                    <Badge bg="primary">
                        {formatWeekRange(week)}
                    </Badge>
                )}
            </Card.Body>
        </Card>
    );
};