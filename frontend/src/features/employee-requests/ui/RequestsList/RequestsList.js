// frontend/src/features/employee-requests/ui/RequestsList/RequestsList.js
import React from 'react';
import { ListGroup } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { formatDateTime } from 'shared/lib/utils/scheduleUtils';
import './RequestsList.css';

const RequestsList = ({ requests, onRequestClick }) => {
    const { t, locale } = useI18n();


    // Separate pending and processed requests
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    const RequestItem = ({ request }) => {
        const constraintsCount = request.constraints?.length || 0;

        return (
            <ListGroup.Item
                action
                onClick={() => onRequestClick(request)}
                className="request-item"
            >
                <div className="d-flex justify-content-between align-items-start">
                    <div className="request-info">
                        <div className="request-date">
                            <i className="bi bi-clock me-2"></i>
                            {t('requests.sent')}: {formatDateTime(request.requested_at, locale)}
                        </div>
                        <div className="request-constraints-count text-muted">
                            {constraintsCount} {t('requests.constraints')}
                        </div>
                        {request.reviewed_at && (
                            <div className="request-reviewed">
                                <i className="bi bi-check-circle me-2"></i>
                                {t('requests.reviewed')}: {formatDateTime(request.reviewed_at, locale)}
                            </div>
                        )}
                        {request.reviewer && (
                            <div className="request-reviewer text-muted">
                                {t('requests.reviewedBy')}: {`${request.reviewer.first_name} ${request.reviewer.last_name}`}
                            </div>
                        )}
                    </div>
                    <StatusBadge
                        status={request.status}
                        statusText={t(`requests.status.${request.status}`)}
                    />

                </div>
            </ListGroup.Item>
        );
    };

    return (
        <div className="requests-list">
            {pendingRequests.length > 0 && (
                <div className="mb-4">
                    <h6 className="text-muted mb-3">{t('requests.pendingRequests')}</h6>
                    <ListGroup>
                        {pendingRequests.map(request => (
                            <RequestItem key={request.id} request={request} />
                        ))}
                    </ListGroup>
                </div>
            )}

            {processedRequests.length > 0 && (
                <div>
                    <h6 className="text-muted mb-3">{t('requests.processed_requests')}</h6>
                    <ListGroup>
                        {processedRequests.map(request => (
                            <RequestItem key={request.id} request={request} />
                        ))}
                    </ListGroup>
                </div>
            )}
        </div>
    );
};

export default RequestsList;