// frontend/src/features/admin-schedule-management/ui/ScheduleView/index.js
import React from 'react';
import { Modal, Button, Alert, ListGroup } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ValidationModal.css';

const ValidationModal = ({ show, onHide, onConfirm, violations, title }) => {
    const { t } = useI18n();

    const groupedViolations = violations.reduce((acc, violation) => {
        if (!acc[violation.type]) {
            acc[violation.type] = [];
        }
        acc[violation.type].push(violation);
        return acc;
    }, {});

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

                {Object.entries(groupedViolations).map(([type, violations]) => (
                    <div key={type} className="mb-3">
                        <h6 className="text-danger">
                            {t(`validation.${type}`)}
                        </h6>
                        <ListGroup>
                            {violations.map((violation, idx) => (
                                <ListGroup.Item key={idx} variant="warning">
                                    {type === 'rest_violation' && (
                                        <div>
                                            <strong>{violation.employeeName}</strong>
                                            <br />
                                            {t('validation.restViolationDetail', {
                                                date: violation.date,
                                                restHours: violation.restHours,
                                                requiredRest: violation.requiredRest,
                                                currentShift: violation.currentShift || violation.previousShift,
                                                nextShift: violation.nextShift
                                            })}
                                        </div>
                                    )}
                                    {type === 'weekly_hours_violation' && (
                                        <div>
                                            <strong>{violation.employeeName}</strong>
                                            <br />
                                            {t('validation.weeklyHoursDetail', {
                                                totalHours: violation.totalHours,
                                                maxHours: violation.maxHours
                                            })}
                                        </div>
                                    )}
                                    {type === 'daily_hours_violation' && (
                                        <div>
                                            <strong>{violation.employeeName}</strong>
                                            <br />
                                            {t('validation.dailyHoursDetail', {
                                                date: violation.date,
                                                totalHours: violation.totalHours,
                                                maxHours: violation.maxHours
                                            })}
                                        </div>
                                    )}
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

export default ValidationModal;