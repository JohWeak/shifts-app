// frontend/src/features/employee-requests/ui/RequestDetails/index.js
import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useDispatch, useSelector } from 'react-redux';
import { employeeAPI } from 'shared/api/apiService';
import { deleteRequest } from '../../model/requestsSlice';
import StatusBadge from 'shared/ui/components/StatusBadge';
import LoadingState from 'shared/ui/components/LoadingState';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import { formatDateTime, getDayName } from 'shared/lib/utils/scheduleUtils';
import { getDayIndex, groupConstraintsByDay } from 'shared/lib/utils/constraintUtils';
import './RequestDetails.css';

const RequestDetails = ({ request, onBack, onEdit, onDelete, employeeId = null }) => {
    const { t, locale } = useI18n();
    const dispatch = useDispatch();
    const [shiftsData, setShiftsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const weekStartsOn = useSelector(state => state.settings?.systemSettings?.weekStartDay || 0);

    useEffect(() => {
        void loadShiftDetails();
    }, []);

    const loadShiftDetails = async () => {
        try {
            const response = employeeId
                ? await employeeAPI.getEmployeeShifts(employeeId)
                : await employeeAPI.getEmployeeShifts();
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
            if (onDelete) {
                await onDelete(request);
            } else {
                await dispatch(deleteRequest(request.id)).unwrap();
            }
            onBack();
        } catch (error) {
            console.error('Error deleting request:', error);
        }
        setShowDeleteConfirm(false);
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(request);
        }
    };


    if (loading) {
        return <LoadingState />;
    }

    const constraintsByDay = groupConstraintsByDay(request.constraints, weekStartsOn);


    const canEdit = request.status === 'pending' && !request.id.toString().startsWith('temp_');
    const canDelete = request.status === 'pending';

    return (
        <Container className="request-details-container py-3">
            <Card className="request-details-card">
                <Card.Header className="request-details-header bg-transparent">
                    <div className=" d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('requests.requestDetails')}</h5>
                        <StatusBadge
                            status={request.status}
                            text={t(`requests.status.${request.status}`)}
                        />
                        {request.status === 'approved' && !request.is_active && (
                            <Badge bg="secondary" pill>
                                {t('requests.inactive')}
                            </Badge>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="request-metadata">
                        <div className="metadata-item">
                            <i className="bi bi-calendar-event me-2"></i>
                            <span className="metadata-label">{t('requests.sent')}:</span>
                            <span className="metadata-value">{formatDateTime(request.requested_at, locale)}</span>
                        </div>
                        {request.reviewed_at && (<>
                            <div className="metadata-item">
                                <i className="bi bi-calendar-check me-2"></i>
                                <span className="metadata-label">{t('requests.reviewed')}:</span>
                                <span
                                    className="metadata-value">{formatDateTime(request.reviewed_at, locale)}</span>
                            </div>
                            {request.reviewer && (<div className="metadata-item">
                                <i className="bi bi-person-check me-2"></i>
                                <span className="metadata-label">{t('requests.reviewedBy')}:</span>
                                <span className="metadata-value">
                                            {`${request.reviewer.first_name} ${request.reviewer.last_name}`}
                                        </span>
                            </div>)}
                        </>)}
                    </div>

                    <div className="constraints-section">
                        <h6 className="section-title">
                            <i className="bi bi-clock-history me-2"></i>
                            {t('requests.constraints')}
                        </h6>
                        <div className="constraints-details">
                            {Object.entries(constraintsByDay).length === 0 ? (
                                <div className="text-muted">{t('requests.noConstraints')}</div>) : (
                                <div className="constraints-box px-3">
                                    {Object.entries(constraintsByDay).map(([day, constraints]) => {
                                        const dayIndex = getDayIndex(day, weekStartsOn);
                                        return (
                                            <div key={day} className="day-constraints">
                                                <strong className="day-name">
                                                    {getDayName(dayIndex, t)}:
                                                </strong>
                                                <div className="constraints-list">
                                                    {constraints.map((constraint, index) => (
                                                        <span key={index} className="constraint-badge">
                                                    {constraint.shift_id && shiftsData[constraint.shift_id] ?
                                                        shiftsData[constraint.shift_id].shift_name :
                                                        t('requests.wholeDay')}
                                                    </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>)}
                        </div>
                    </div>


                    {request.message && (<div className="message-section">
                        <h6 className="section-title">
                            <i className="bi bi-chat-left-text me-2"></i>
                            {t('requests.yourMessage')}
                        </h6>
                        <Alert variant="info" className="message-content">
                            {request.message}
                        </Alert>
                    </div>)}

                    {request.admin_response && (<div className="response-section">
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
                    </div>)}
                    <div className="action-buttons d-flex justify-content-between align-items-center">
                        <Button
                            variant="outline-primary"
                            onClick={onBack}
                            className="rounded-4"
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            {t('common.back')}
                        </Button>

                        {(canEdit || canDelete) && (
                            <div className="d-flex gap-2">
                                {canEdit && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleEdit}
                                        className="rounded-4"
                                    >
                                        <i className="bi bi-pencil me-1"></i>
                                        {t('common.edit')}
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="rounded-4"
                                    >
                                        <i className="bi bi-trash me-1"></i>
                                        {t('common.delete')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
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
        </Container>);
};

export default RequestDetails;