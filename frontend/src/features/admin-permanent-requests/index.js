// frontend/src/features/admin-permanent-requests/index.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Table, Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchAllRequests } from './model/adminRequestsSlice';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import RequestReviewModal from './ui/RequestReviewModal/RequestReviewModal';
import { formatDateTime } from 'shared/lib/utils/scheduleUtils';
import { useSortableData } from 'shared/hooks/useSortableData';
import './index.css';

const AdminPermanentRequests = () => {
    const { t, locale } = useI18n();
    const dispatch = useDispatch();

    const { items: requests, loading, error } = useSelector(state => {
        return state.adminRequests;
    });

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        dispatch(fetchAllRequests());
    }, [dispatch]);

    // Разделяем запросы на pending и processed
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    // Сортировка для pending запросов (старые первые)
    const {
        sortedItems: sortedPendingRequests, // <-- ИСПРАВЛЕНО: используем правильное имя свойства
        requestSort: requestPendingSort,
        sortConfig: pendingSortConfig
    } = useSortableData(pendingRequests, { field: 'requested_at', order: 'ASC' }); // field/order

// Сортировка для обработанных запросов
    const {
        sortedItems: sortedProcessedRequests, // <-- ИСПРАВЛЕНО: используем правильное имя свойства
        requestSort: requestProcessedSort,
        sortConfig: processedSortConfig
    } = useSortableData(processedRequests, { field: 'reviewed_at', order: 'DESC' });

    const handleRequestClick = (request) => {
        setSelectedRequest(request);
        setShowReviewModal(true);
    };

    const handleReviewComplete = () => {
        setShowReviewModal(false);
        setSelectedRequest(null);
        dispatch(fetchAllRequests());
    };

    const RequestsTable = ({ requests, sortConfig, requestSort, isPending }) => (
        <div className="table-responsive">
            <Table hover className="requests-table mb-0">
                <thead>
                <tr>
                    <SortableHeader
                        label={t('admin.requests.employee')}
                        sortKey="employee.first_name"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    />
                    <th>{t('admin.requests.position')}</th>
                    <th>{t('admin.requests.worksite')}</th>
                    <th>{t('admin.requests.status')}</th>
                    <SortableHeader
                        label={t('admin.requests.sentAt')}
                        sortKey="requested_at"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    />
                    {!isPending && (
                        <SortableHeader
                            label={t('admin.requests.reviewedAt')}
                            sortKey="reviewed_at"
                            sortConfig={sortConfig}
                            onSort={requestSort}
                        />
                    )}
                </tr>
                </thead>
                <tbody>
                {requests && requests.map(request => (
                    <tr
                        key={request.id}
                        onClick={() => handleRequestClick(request)}
                        className="request-row"
                    >
                        <td>
                            {request.employee
                                ? `${request.employee.first_name} ${request.employee.last_name}`
                                : '-'
                            }
                        </td>
                        <td>
                            {request.employee?.defaultPosition?.pos_name || '-'}
                        </td>
                        <td>
                            {request.employee?.workSite?.site_name || '-'}
                        </td>
                        <td>
                            <StatusBadge
                                status={request.status}
                                text={t(`requests.status.${request.status}`)}
                            />
                        </td>
                        <td>{formatDateTime(request.requested_at, locale)}</td>
                        {!isPending && (
                            <td>
                                {request.reviewed_at
                                    ? formatDateTime(request.reviewed_at, locale)
                                    : '-'
                                }
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <Container className="py-3">
                <EmptyState
                    icon="bi-exclamation-triangle"
                    title={t('common.error')}
                    message={error}
                    onAction={() => dispatch(fetchAllRequests())}
                    actionLabel={t('common.retry')}
                />
            </Container>
        );
    }

    return (
        <Container className="admin-permanent-requests py-3">
            <PageHeader
                title={t('admin.requests.title')}
                badge={pendingRequests.length > 0 ? {
                    text: `${pendingRequests.length} ${t('admin.requests.pending')}`,
                    variant: 'warning'
                } : null}
            />

            {pendingRequests.length > 0 && (
                <Card className="mb-3">
                    <Card.Header className="bg-warning bg-opacity-10">
                        <h5 className="mb-0">
                            {t('admin.requests.pendingRequests')} ({pendingRequests.length})
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <RequestsTable
                            requests={sortedPendingRequests}
                            sortConfig={pendingSortConfig}
                            requestSort={requestPendingSort}
                            isPending={true}
                        />
                    </Card.Body>
                </Card>
            )}

            {processedRequests.length > 0 && (
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">
                            {t('admin.requests.processedRequests')} ({processedRequests.length})
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <RequestsTable
                            requests={sortedProcessedRequests}
                            sortConfig={processedSortConfig}
                            requestSort={requestProcessedSort}
                            isPending={false}
                        />
                    </Card.Body>
                </Card>
            )}

            {requests.length === 0 && (
                <Card>
                    <Card.Body>
                        <EmptyState
                            icon="bi-inbox"
                            title={t('admin.requests.noRequests')}
                            message={t('admin.requests.noRequestsMessage')}
                        />
                    </Card.Body>
                </Card>
            )}

            {selectedRequest && (
                <RequestReviewModal
                    show={showReviewModal}
                    onHide={() => setShowReviewModal(false)}
                    request={selectedRequest}
                    onReviewComplete={handleReviewComplete}
                />
            )}
        </Container>
    );
};

export default AdminPermanentRequests;