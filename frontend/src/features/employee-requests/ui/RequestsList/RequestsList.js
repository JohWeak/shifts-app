// frontend/src/features/employee-requests/ui/RequestsList/RequestsList.js
import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { useI18n } from '../../../../shared/lib/i18n/i18nProvider';
import './RequestsList.css';

const RequestsList = ({ requests, onRequestClick }) => {
    const { t } = useI18n();

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'warning',
            approved: 'success',
            rejected: 'danger'
        };

        return (
            <Badge bg={variants[status]}>
                {t(`requests.status.${status}`)}
            </Badge>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    // Separate pending and processed requests
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="requests-list">
            {pendingRequests.length > 0 && (
                <div className="mb-4">
                    <h6 className="text-muted mb-3">{t('requests.pending_requests')}</h6>
                    <ListGroup>
                        {pendingRequests.map(request => (
                            <ListGroup.Item
                                key={request.id}
                                action
                                onClick={() => onRequestClick(request)}
                                className="request-item"
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="request-info">
                                        <div className="request-date">
                                            <i className="bi bi-clock me-2"></i>
                                            {t('requests.sent')}: {formatDate(request.requested_at)}
                                        </div>
                                        <div className="request-constraints-count text-muted">
                                            {request.constraints ? request.constraints.length : 0} {t('requests.constraints')}
                                        </div>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            )}

            {processedRequests.length > 0 && (
                <div>
                    <h6 className="text-muted mb-3">{t('requests.processed_requests')}</h6>
                    <ListGroup>
                        {processedRequests.map(request => (
                            <ListGroup.Item
                                key={request.id}
                                action
                                onClick={() => onRequestClick(request)}
                                className="request-item"
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="request-info">
                                        <div className="request-date">
                                            <i className="bi bi-clock me-2"></i>
                                            {t('requests.sent')}: {formatDate(request.requested_at)}
                                        </div>
                                        {request.reviewed_at && (
                                            <div className="request-reviewed">
                                                <i className="bi bi-check-circle me-2"></i>
                                                {t('requests.reviewed')}: {formatDate(request.reviewed_at)}
                                            </div>
                                        )}
                                        {request.reviewer && (
                                            <div className="request-reviewer text-muted">
                                                {t('requests.reviewed_by')}: {request.reviewer.full_name}
                                            </div>
                                        )}
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            )}
        </div>
    );
};

export default RequestsList;