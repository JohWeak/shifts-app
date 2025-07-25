// frontend/src/features/employee-requests/ui/RequestDetails/RequestDetails.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useDispatch } from 'react-redux';
import { constraintAPI } from 'shared/api/apiService';
import { deleteRequest } from '../../model/requestsSlice';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import { formatDateTime, getDayName } from 'shared/lib/utils/scheduleUtils';
import './RequestDetails.css';

const RequestDetails = ({ request, onBack }) => {
    const { t, locale } = useI18n();
    const dispatch = useDispatch();
    const [shiftsData, setShiftsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadShiftDetails();
    }, []);

    const loadShiftDetails = async () => {
        try {
            const response = await constraintAPI.getEmployeeShifts();
            const shifts = response.data?.shifts || [];

            const shiftsMap = {};
            shifts.forEach(shift => {
                shiftsMap[shift.id] = shift;
            });

            setShiftsData(shiftsMap);
        } catch (error) {
            console.error('Error loading shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await dispatch(deleteRequest(request.id)).unwrap();
            onBack();
        } catch (error) {
            console.error('Error deleting request:', error);
        }
        setShowDeleteConfirm(false);
    };

    const groupConstraintsByDay = () => {
        const grouped = {};
        const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        if (request.constraints && Array.isArray(request.constraints)) {
            request.constraints.forEach(constraint => {
                const dayLower = constraint.day_of_week.toLowerCase();
                if (!grouped[dayLower]) {
                    grouped[dayLower] = [];
                }
                grouped[dayLower].push(constraint);
            });
        }

        const sortedGrouped = {};
        daysOrder.forEach(day => {
            if (grouped[day]) {
                sortedGrouped[day] = grouped[day];
            }
        });

        return sortedGrouped;
    };

    if (loading) {
        return <LoadingState />;
    }

    const constraintsByDay = groupConstraintsByDay();
    const dayIndices = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    };

    const canDelete = request.status === 'pending';

    return (
        <Container className="request-details-container py-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button
                    variant="link"
                    onClick={onBack}
                    className="p-0 text-body"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    {t('common.back')}
                </Button>

                {canDelete && (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <i className="bi bi-trash me-1"></i>
                        {t('common.delete')}
                    </Button>
                )}
            </div>

            <Card className="request-details-card">
                <Card.Header className="bg-transparent">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('requests.requestDetails')}</h5>
                        <StatusBadge
                            status={request.status}
                            text={t(`requests.status.${request.status}`)}
                            size="lg"
                        />
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="request-metadata">
                        <div className="metadata-item">
                            <i className="bi bi-calendar-event me-2"></i>
                            <span className="metadata-label">{t('requests.sent')}:</span>
                            <span className="metadata-value">{formatDateTime(request.requested_at, locale)}</span>
                        </div>
                        {request.reviewed_at && (
                            <>
                                <div className="metadata-item">
                                    <i className="bi bi-calendar-check me-2"></i>
                                    <span className="metadata-label">{t('requests.reviewed')}:</span>
                                    <span className="metadata-value">{formatDateTime(request.reviewed_at, locale)}</span>
                                </div>
                                {request.reviewer && (
                                    <div className="metadata-item">
                                        <i className="bi bi-person-check me-2"></i>
                                        <span className="metadata-label">{t('requests.reviewedBy')}:</span>
                                        <span className="metadata-value">
                                            {`${request.reviewer.first_name} ${request.reviewer.last_name}`}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="constraints-section">
                        <h6 className="section-title">
                            <i className="bi bi-clock-history me-2"></i>
                            {t('requests.constraints')}
                        </h6>
                        <div className="constraints-details">
                            {Object.entries(constraintsByDay).length === 0 ? (
                                <div className="text-muted">{t('requests.noConstraints')}</div>
                            ) : (
                                Object.entries(constraintsByDay).map(([day, constraints]) => (
                                    <div key={day} className="day-constraints">
                                        <div className="day-name">
                                            {getDayName(dayIndices[day], t)}
                                        </div>
                                        <div className="constraints-list">
                                            {constraints.map((constraint, index) => (
                                                <div key={index} className="constraint-item">
                                                    {constraint.shift_id && shiftsData[constraint.shift_id] ? (
                                                        <>
                                                            <span className="shift-name">
                                                                {shiftsData[constraint.shift_id].shift_name}
                                                            </span>
                                                            <span className="constraint-type cannot-work">
                                                                {t('constraints.cannotWork')}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="constraint-type cannot-work full-day">
                                                            {t('requests.wholeDay')}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {request.message && (
                        <div className="message-section">
                            <h6 className="section-title">
                                <i className="bi bi-chat-left-text me-2"></i>
                                {t('requests.yourMessage')}
                            </h6>
                            <Alert variant="info" className="message-content">
                                {request.message}
                            </Alert>
                        </div>
                    )}

                    {request.admin_response && (
                        <div className="response-section">
                            <h6 className="section-title">
                                <i className="bi bi-reply me-2"></i>
                                {t('requests.adminResponse')}
                            </h6>
                            <Alert
                                variant={request.status === 'approved' ? 'success' : 'warning'}
                                className="response-content"
                            >
                                {request.admin_response}
                            </Alert>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={showDeleteConfirm}
                onHide={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title={t('requests.deleteRequest')}
                message={t('requests.confirmDelete')}
                confirmText={t('common.delete')}
                confirmVariant="danger"
            />
        </Container>
    );
};

export default RequestDetails;