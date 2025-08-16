// frontend/src/features/admin-schedule-management/ui/schedule-table/ValidationModal.js
import React from 'react';
import { Modal, Button, Alert, ListGroup } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

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
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="warning">
                    {t('schedule.validationWarningMessage')}
                </Alert>

                {Object.entries(groupedViolations).map(([type, violations]) => (
                    <div key={type} className="mb-3">
                        <h6>{t(`validation.${type}`)}</h6>
                        <ListGroup>
                            {violations.map((violation, idx) => (
                                <ListGroup.Item key={idx} variant="warning">
                                    {type === 'rest_violation' && (
                                        <>
                                            {t('validation.restViolationDetail', {
                                                employee: violation.employeeId,
                                                date: violation.date,
                                                restHours: violation.restHours,
                                                requiredRest: violation.requiredRest
                                            })}
                                        </>
                                    )}
                                    {type === 'weekly_hours_violation' && (
                                        <>
                                            {t('validation.weeklyHoursDetail', {
                                                employee: violation.employeeId,
                                                totalHours: violation.totalHours,
                                                maxHours: violation.maxHours
                                            })}
                                        </>
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
                    {t('schedule.saveAnyway')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ValidationModal;