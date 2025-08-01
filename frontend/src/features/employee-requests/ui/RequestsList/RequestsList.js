// frontend/src/features/employee-requests/ui/RequestsList/RequestsList.js
import React from 'react';
import {ListGroup, Button, Dropdown} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import {formatDateTime} from 'shared/lib/utils/scheduleUtils';
import './RequestsList.css';

const RequestsList = ({requests, onRequestClick, onEditRequest, onDeleteRequest}) => {
    const {t, locale, direction} = useI18n();

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    const CustomToggle = React.forwardRef(({children, onClick}, ref) => (
        <button
            ref={ref}
            onClick={(e) => {
                e.preventDefault(); // Prevent default button behavior
                onClick(e);       // Open the dropdown
            }}
            className="actions-dropdown-toggle"
            aria-label="Actions"
        >
            <i className="bi bi-three-dots-vertical"></i>
        </button>
    ));

    const RequestItem = ({request}) => {
        const constraintsCount = request.constraints?.length || 0;
        const canEdit = request.status === 'pending' && !request.id.toString().startsWith('temp_');

        return (
            <ListGroup.Item className="request-item p-0">
                <div className="request-item-content">
                    <div
                        className="request-clickable-area"
                        onClick={() => onRequestClick(request)}
                    >
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
                            text={t(`requests.status.${request.status}`)}
                        />

                    </div>

                </div>
                {canEdit && (
                    <Dropdown >
                        <Dropdown.Toggle as={CustomToggle} id={`request-actions-${request.id}`} />

                        <Dropdown.Menu >
                            {/* Edit Button */}
                            <Dropdown.Item onClick={() => onEditRequest(request)}>
                                <i className="bi bi-pencil me-2"></i>
                                {t('common.edit')}
                            </Dropdown.Item>

                            {/* Delete Button */}
                            <Dropdown.Item onClick={() => onDeleteRequest(request)} className="text-danger">
                                <i className="bi bi-trash me-2"></i>
                                {t('common.delete')}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )}
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
                            <RequestItem key={request.id} request={request}/>
                        ))}
                    </ListGroup>
                </div>
            )}

            {processedRequests.length > 0 && (
                <div>
                    <h6 className="text-muted mb-3">{t('requests.processedRequests')}</h6>
                    <ListGroup>
                        {processedRequests.map(request => (
                            <RequestItem key={request.id} request={request}/>
                        ))}
                    </ListGroup>
                </div>
            )}
        </div>
    );
};

export default RequestsList;