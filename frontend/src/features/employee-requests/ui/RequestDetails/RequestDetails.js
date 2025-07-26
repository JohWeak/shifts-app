// frontend/src/features/employee-requests/ui/RequestDetails/RequestDetails.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { constraintAPI } from 'shared/api/apiService';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import { formatDateTime, getDayName } from 'shared/lib/utils/scheduleUtils';
import './RequestDetails.css';

const RequestDetails = ({ request, onBack }) => {
    const { t } = useI18n();
    const [shiftsData, setShiftsData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadShiftDetails();
    }, []);

    const loadShiftDetails = async () => {
        try {
            const response = await constraintAPI.getEmployeeShifts();
            const shifts = response.data?.shifts || [];

            // Create a map for quick lookup
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

    const getStatusVariant = (status) => {
        const variants = {
            pending: 'warning',
            approved: 'success',
            rejected: 'danger'
        };
        return variants[status] || 'secondary';
    };

    const groupConstraintsByDay = () => {
        const grouped = {};
        const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        if (request.constraints && Array.isArray(request.constraints)) {
            request.constraints.forEach(constraint => {
                if (!grouped[constraint.day_of_week]) {
                    grouped[constraint.day_of_week] = [];
                }
                grouped[constraint.day_of_week].push(constraint);
            });
        }

        // Sort by day order
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
                        <StatusBadge
                            status={request.status}
                            variant={getStatusVariant(request.status)}
                            text={t(`requests.status.${request.status}`)}
                            size="lg"
                        />
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="request-metadata mb-4">
                        <div className="mb-2">
                            <strong>{t('requests.sent')}:</strong> {formatDateTime(request.requested_at)}
                        </div>
                        {request.reviewed_at && (
                            <>
                                <div className="mb-2">
                                    <strong>{t('requests.reviewed')}:</strong> {formatDateTime(request.reviewed_at)}
                                </div>
                                {request.reviewer && (
                                    <div className="mb-2">
                                        <strong>{t('requests.reviewed_by')}:</strong> {`${request.reviewer.first_name} ${request.reviewer.last_name}`}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <h6 className="mb-3">{t('requests.constraints')}:</h6>
                    <div className="constraints-details">
                        {Object.entries(constraintsByDay).map(([day, constraints]) => (
                            <div key={day} className="day-constraints mb-3">
                                <strong>{getDayName(dayIndices[day], t)}:</strong>
                                <ul className="mt-1">
                                    {constraints.map((constraint, index) => (
                                        <li key={index}>
                                            {constraint.shift_id && shiftsData[constraint.shift_id] ? (
                                                <>
                                                    {shiftsData[constraint.shift_id].shift_name}
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