// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/ValidationModal/index.js
import React from 'react';
import { Modal, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ValidationModal.css';

const ValidationModal = ({ show, onHide, onConfirm, violations, title }) => {
    const { t } = useI18n();

    const groupedViolations = violations.reduce((acc, violation) => {
        // Use type for grouping (rest_violation, weekly_hours_violation, etc.)
        const groupType = violation.type === 'before' || violation.type === 'after'
            ? 'rest_violation'
            : violation.type;

        if (!acc[groupType]) {
            acc[groupType] = [];
        }
        acc[groupType].push(violation);
        return acc;
    }, {});

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" className="validation-modal">
            <Modal.Header closeButton>
                <Modal.Title>{title || t('schedule.validationWarning')}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert variant="warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {t('schedule.validationWarningMessage')}
                </Alert>

                {Object.entries(groupedViolations).map(([groupType, violations]) => (
                    <div key={groupType} className="mb-4">
                        <h6 className="text-danger mb-3">
                            <i className={`bi ${getIconForViolationType(groupType)} me-2`}></i>
                            {t(`validation.${groupType}.title`)}
                        </h6>
                        <ListGroup>
                            {violations.map((violation, idx) => (
                                <ListGroup.Item key={idx} variant="warning" className="violation-item">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="violation-details">
                                            <strong className="employee-name">
                                                {violation.employeeName}
                                            </strong>

                                            {/* Rest violations (before/after types) */}
                                            {groupType === 'rest_violation' && (
                                                <div className="mt-2">
                                                    {violation.type === 'before' && (
                                                        <span className="text-muted">
                                                            {t('validation.rest_violation.beforeDetail', {
                                                                date: formatDate(violation.date),
                                                                nextShift: violation.nextShift,
                                                                restHours: violation.restHours,
                                                                requiredRest: violation.requiredRest
                                                            })}
                                                        </span>
                                                    )}
                                                    {violation.type === 'after' && (
                                                        <span className="text-muted">
                                                            {t('validation.rest_violation.afterDetail', {
                                                                date: formatDate(violation.date),
                                                                previousShift: violation.previousShift,
                                                                restHours: violation.restHours,
                                                                requiredRest: violation.requiredRest
                                                            })}
                                                        </span>
                                                    )}
                                                    {!violation.type && (
                                                        <span className="text-muted">
                                                            {t('validation.rest_violation.generalDetail', {
                                                                date: formatDate(violation.date),
                                                                restHours: violation.restHours,
                                                                requiredRest: violation.requiredRest
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Weekly hours violation */}
                                            {groupType === 'weekly_hours_violation' && (
                                                <div className="mt-2">
                                                    <span className="text-muted">
                                                        {t('validation.weekly_hours_violation.detail', {
                                                            totalHours: violation.totalHours,
                                                            maxHours: violation.maxHours
                                                        })}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Daily hours violation */}
                                            {groupType === 'daily_hours_violation' && (
                                                <div className="mt-2">
                                                    <span className="text-muted">
                                                        {t('validation.daily_hours_violation.detail', {
                                                            date: formatDate(violation.date),
                                                            totalHours: violation.totalHours,
                                                            maxHours: violation.maxHours
                                                        })}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Consecutive shifts violation */}
                                            {groupType === 'consecutive_shifts_violation' && (
                                                <div className="mt-2">
                                                    <span className="text-muted">
                                                        {t('validation.consecutive_shifts_violation.detail', {
                                                            consecutiveDays: violation.consecutiveDays,
                                                            maxDays: violation.maxDays
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="violation-severity">
                                            <Badge variant={getSeverityVariant(violation)}>
                                                {t(`validation.severity.${getSeverityLevel(violation)}`)}
                                            </Badge>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                ))}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('common.cancel')}
                </Button>
                <Button variant="warning" onClick={onConfirm}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {t('schedule.saveAnyway')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// Helper functions
const getIconForViolationType = (type) => {
    const icons = {
        'rest_violation': 'bi-clock-history',
        'weekly_hours_violation': 'bi-calendar-week',
        'daily_hours_violation': 'bi-calendar-day',
        'consecutive_shifts_violation': 'bi-arrow-repeat'
    };
    return icons[type] || 'bi-exclamation-circle';
};

const getSeverityLevel = (violation) => {
    // Determine severity based on how much the constraint is violated
    if (violation.type === 'rest_violation') {
        const deficit = violation.requiredRest - violation.restHours;
        if (deficit >= 4) return 'critical';
        if (deficit >= 2) return 'high';
        return 'medium';
    }

    if (violation.type === 'weekly_hours_violation') {
        const excess = violation.totalHours - violation.maxHours;
        if (excess >= 8) return 'critical';
        if (excess >= 4) return 'high';
        return 'medium';
    }

    if (violation.type === 'daily_hours_violation') {
        const overtime = violation.totalHours - violation.maxHours;
        if (overtime >= 1) return 'critical';
    }

    return 'medium';
};

const getSeverityVariant = (violation) => {
    const level = getSeverityLevel(violation);
    const variants = {
        'critical': 'danger',
        'high': 'warning',
        'medium': 'info'
    };
    return variants[level] || 'warning';
};

export default ValidationModal;