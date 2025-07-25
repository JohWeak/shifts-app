// frontend/src/features/employee-requests/ui/RequestDetails/RequestDetails.js
import React from 'react';
import { Container, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useI18n } from '../../../../shared/lib/i18n/i18nProvider';
import './RequestDetails.css';

const RequestDetails = ({ request, onBack }) => {
    const { t } = useI18n();

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'warning',
            approved: 'success',
            rejected: 'danger'
        };

        return (
            <Badge bg={variants[status]} className="fs-6">
                {t(`requests.status.${status}`)}
            </Badge>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const groupConstraintsByDay = () => {
        const grouped = {};
        request.constraints.forEach(constraint => {
            if (!grouped[constraint.day_of_week]) {
                grouped[constraint.day_of_week] = [];
            }
            grouped[constraint.day_of_week].push(constraint);
        });
        return grouped;
    };

    const constraintsByDay = groupConstraintsByDay();

    return (
        <Container className="request-details-container py-3">
            <Button
                variant="link"
                onClick={onBack}
                className="mb-3 p-0"
            >
                <i className="bi bi-arrow-left me-2"></i>
                {t('common.back')}
            </Button>

            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('requests.request_details')}</h5>
                        {getStatusBadge(request.status)}
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="request-metadata mb-4">
                        <div className="mb-2">
                            <strong>{t('requests.sent')}:</strong> {formatDate(request.requested_at)}
                        </div>
                        {request.reviewed_at && (
                            <>
                                <div className="mb-2">
                                    <strong>{t('requests.reviewed')}:</strong> {formatDate(request.reviewed_at)}
                                </div>
                                {request.reviewer && (
                                    <div className="mb-2">
                                        <strong>{t('requests.reviewed_by')}:</strong> {request.reviewer.full_name}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <h6 className="mb-3">{t('requests.constraints')}:</h6>
                    <div className="constraints-details">
                        {Object.entries(constraintsByDay).map(([day, constraints]) => (
                            <div key={day} className="day-constraints mb-3">
                                <strong>{t(`common.days.${day}`)}:</strong>
                                <ul className="mt-1">
                                    {constraints.map((constraint, index) => (
                                        <li key={index}>
                                            {constraint.shift_id ? (
                                                <>
                                                    {constraint.shift?.shift_name || `Shift ${constraint.shift_id}`}
                                                    {' - '}
                                                    <span className={`constraint-type ${constraint.constraint_type}`}>
                                                        {t(`constraints.types.${constraint.constraint_type}`)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className={`constraint-type ${constraint.constraint_type}`}>
                                                    {t('requests.whole_day')} - {t(`constraints.types.${constraint.constraint_type}`)}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {request.message && (
                        <div className="mt-4">
                            <h6>{t('requests.your_message')}:</h6>
                            <Alert variant="info" className="mt-2">
                                {request.message}
                            </Alert>
                        </div>
                    )}

                    {request.admin_response && (
                        <div className="mt-4">
                            <h6>{t('requests.admin_response')}:</h6>
                            <Alert
                                variant={request.status === 'approved' ? 'success' : 'warning'}
                                className="mt-2"
                            >
                                {request.admin_response}
                            </Alert>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RequestDetails;