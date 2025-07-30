// frontend/src/features/admin-permanent-requests/ui/RequestReviewModal/RequestReviewModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { reviewRequest } from '../../model/adminRequestsSlice';
import { addNotification } from 'app/model/notificationsSlice';
import { positionAPI } from 'shared/api/apiService';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { formatDateTime, getDayName } from 'shared/lib/utils/scheduleUtils';
import { groupConstraintsByDay, getDayIndex } from 'shared/lib/utils/constraintUtils';
import './RequestReviewModal.css';

const RequestReviewModal = ({ show, onHide, request, onReviewComplete }) => {
    const { t, locale } = useI18n();
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);
    const [loadingShifts, setLoadingShifts] = useState(true);
    const [shiftsData, setShiftsData] = useState({});
    const [adminResponse, setAdminResponse] = useState('');
    const [showResponseField, setShowResponseField] = useState(false);

    const weekStartsOn = useSelector(state =>
        state.settings?.systemSettings?.weekStartDay || 0
    );

    useEffect(() => {
        if (show && request && request.employee?.defaultPosition?.pos_id) {
            loadShiftDetails();
        } else if (show && request) {
            setLoadingShifts(false);
        }
    }, [show, request]);

    const loadShiftDetails = async () => {
        try {
            setLoadingShifts(true);
            const positionId = request.employee.defaultPosition.pos_id;

            const response = await positionAPI.fetchPositionShifts(positionId);
            console.log('Position shifts response:', response);

            const shifts = response || [];
            const shiftsMap = {};
            shifts.forEach(shift => {
                shiftsMap[shift.id] = shift;
            });

            setShiftsData(shiftsMap);
        } catch (error) {
            console.error('Error loading shifts:', error);
        } finally {
            setLoadingShifts(false);
        }
    };

    const handleReview = async (status) => {
        try {
            setLoading(true);

            await dispatch(reviewRequest({
                requestId: request.id,
                status,
                adminResponse: showResponseField ? adminResponse.trim() : null
            })).unwrap();

            dispatch(addNotification({
                type: 'success',
                message: t(`admin.requests.${status}Success`)
            }));

            onReviewComplete();
        } catch (error) {
            dispatch(addNotification({
                type: 'error',
                message: error || t('admin.requests.reviewError')
            }));
        } finally {
            setLoading(false);
        }
    };

    if (!request) return null;

    const constraintsByDay = groupConstraintsByDay(request.constraints, weekStartsOn);

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            backdrop="static"
            className="request-review-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>{t('admin.requests.reviewRequest')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingShifts ? (
                    <LoadingState />
                ) : (
                    <>
                        {/* Employee Information */}
                        <div className="request-employee-info mb-4">
                            <h6 className="section-title">{t('admin.requests.employeeInfo')}</h6>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">{t('admin.requests.name')}:</span>
                                    <span className="info-value">
                                        {request.employee
                                            ? `${request.employee.first_name} ${request.employee.last_name}`
                                            : '-'
                                        }
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">{t('admin.requests.position')}:</span>
                                    <span className="info-value">
                                        {request.employee?.defaultPosition?.pos_name || '-'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">{t('admin.requests.worksite')}:</span>
                                    <span className="info-value">
                                        {request.employee?.workSite?.site_name || '-'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">{t('admin.requests.sentAt')}:</span>
                                    <span className="info-value">
                                        {formatDateTime(request.requested_at, locale)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Constraints */}
                        <div className="request-constraints-section mb-4">
                            <h6 className="section-title">{t('admin.requests.requestedConstraints')}</h6>
                            <div className="constraints-review-box">
                                {Object.entries(constraintsByDay).map(([day, constraints]) => {
                                    const dayIndex = getDayIndex(day, weekStartsOn);
                                    return (
                                        <div key={day} className="day-constraints-review">
                                            <strong className="day-name">
                                                {getDayName(dayIndex, t)}:
                                            </strong>
                                            <div className="constraints-list">
                                                {constraints.map((constraint, index) => (
                                                    <span key={index} className="constraint-badge">
                                                        {constraint.shift_id && shiftsData[constraint.shift_id]
                                                            ? shiftsData[constraint.shift_id].shift_name
                                                            : t('requests.wholeDay')
                                                        }
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Employee Message */}
                        {request.message && (
                            <div className="request-message-section mb-4">
                                <h6 className="section-title">{t('admin.requests.employeeMessage')}</h6>
                                <Alert variant="info" className="mb-0">
                                    {request.message}
                                </Alert>
                            </div>
                        )}

                        {/* Admin Response */}
                        {request.status === 'pending' && (
                            <div className="admin-response-section">
                                <Form.Check
                                    type="checkbox"
                                    id="include-response"
                                    label={t('admin.requests.includeResponse')}
                                    checked={showResponseField}
                                    onChange={(e) => setShowResponseField(e.target.checked)}
                                    className="mb-2"
                                />
                                {showResponseField && (
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        placeholder={t('admin.requests.responsePlaceholder')}
                                        className="admin-response-textarea"
                                    />
                                )}
                            </div>
                        )}

                        {/* Previous Review Info */}
                        {request.status !== 'pending' && (
                            <div className="previous-review-info">
                                <Alert variant={request.status === 'approved' ? 'success' : 'danger'}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span>
                                            {t('admin.requests.reviewedBy')}: {request.reviewer?.first_name} {request.reviewer?.last_name}
                                        </span>
                                        <StatusBadge
                                            status={request.status}
                                            text={t(`requests.status.${request.status}`)}
                                        />
                                    </div>
                                    {request.reviewed_at && (
                                        <div className="small">
                                            {t('admin.requests.reviewedAt')}: {formatDateTime(request.reviewed_at, locale)}
                                        </div>
                                    )}
                                    {request.admin_response && (
                                        <div className="mt-3">
                                            <strong>{t('admin.requests.response')}:</strong>
                                            <div className="mt-1">{request.admin_response}</div>
                                        </div>
                                    )}
                                </Alert>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    {t('common.close')}
                </Button>
                {request.status === 'pending' && !loadingShifts && (
                    <>
                        <Button
                            variant="danger"
                            onClick={() => handleReview('rejected')}
                            disabled={loading}
                        >
                            {loading ? <Spinner size="sm" /> : t('admin.requests.reject')}
                        </Button>
                        <Button
                            variant="success"
                            onClick={() => handleReview('approved')}
                            disabled={loading}
                        >
                            {loading ? <Spinner size="sm" /> : t('admin.requests.approve')}
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default RequestReviewModal;