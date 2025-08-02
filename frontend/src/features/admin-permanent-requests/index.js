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

    useEffect(() => {
        console.log('[AdminPermanentRequests] All requests:', requests);
        console.log('[AdminPermanentRequests] Pending:', pendingRequests.length);
        console.log('[AdminPermanentRequests] Active processed:', activeProcessedRequests.length);
        console.log('[AdminPermanentRequests] Inactive:', inactiveRequests.length);
    }, [requests]);

    // Разделяем запросы на pending и processed
    const pendingRequests = requests.filter(r => r.status === 'pending');

    // Активные обработанные - это approved с is_active === true
    const activeProcessedRequests = requests.filter(r =>
        r.status === 'approved' && r.is_active === true
    );

    // Неактивные - это rejected ИЛИ approved с is_active === false
    const inactiveRequests = requests.filter(r =>
        r.status === 'rejected' || (r.status === 'approved' && r.is_active === false)
    );

    const sortAccessors = {
        'employee.first_name': (item) => item.employee?.first_name || '',
        'employee.defaultPosition.pos_name': (item) => item.employee?.defaultPosition?.pos_name || '',
        'employee.workSite.site_name': (item) => item.employee?.workSite?.site_name || ''
    };
    // Сортировка для каждой группы
    const {
        sortedItems: sortedPendingRequests,
        requestSort: requestPendingSort,
        sortConfig: pendingSortConfig
    } = useSortableData(pendingRequests, { field: 'requested_at', order: 'ASC' }, sortAccessors);

    const {
        sortedItems: sortedActiveRequests,
        requestSort: requestActiveSort,
        sortConfig: activeSortConfig
    } = useSortableData(activeProcessedRequests, { field: 'reviewed_at', order: 'DESC' }, sortAccessors);

    const {
        sortedItems: sortedInactiveRequests,
        requestSort: requestInactiveSort,
        sortConfig: inactiveSortConfig
    } = useSortableData(inactiveRequests, { field: 'reviewed_at', order: 'DESC' }, sortAccessors);

    const handleRequestClick = (request) => {
        setSelectedRequest(request);
        setShowReviewModal(true);
    };

    const handleReviewComplete = () => {
        setShowReviewModal(false);
        setSelectedRequest(null);
        dispatch(fetchAllRequests());
    };

    const RequestsTable = ({ requests, sortConfig, requestSort, isPending, isInactive }) => (
        <div className="table-responsive">
            <Table hover className="requests-table mb-0">
                <thead>
                <tr>
                    <SortableHeader
                        sortKey="employee.first_name"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    >
                        {t('admin.requests.employee')}
                    </SortableHeader>
                    <SortableHeader
                        sortKey="employee.defaultPosition.pos_name"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    >
                        {t('admin.requests.position')}
                    </SortableHeader>
                    <SortableHeader
                        sortKey="employee.workSite.site_name"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    >
                        {t('admin.requests.worksite')}
                    </SortableHeader>

                    <SortableHeader
                        sortKey="requested_at"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    >
                        {t('admin.requests.sentAt')}
                    </SortableHeader>
                    {!isPending && (
                        <SortableHeader
                            sortKey="reviewed_at"
                            sortConfig={sortConfig}
                            onSort={requestSort}
                        >
                            {t('admin.requests.reviewedAt')}
                        </SortableHeader>
                    )}
                    <SortableHeader
                        sortKey="status"
                        sortConfig={sortConfig}
                        onSort={requestSort}
                    >
                        {t('admin.requests.status')}
                    </SortableHeader>
                </tr>
                </thead>
                <tbody>
                {requests && requests.map(request => (
                    <tr
                        key={request.id}
                        onClick={() => handleRequestClick(request)}
                        className={`request-row ${isInactive ? 'inactive' : ''}`}
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

                        <td>{formatDateTime(request.requested_at, locale)}</td>
                        {!isPending && (
                            <td>
                                {request.reviewed_at
                                    ? formatDateTime(request.reviewed_at, locale)
                                    : '-'
                                }
                            </td>
                        )}
                        <td>
                            <StatusBadge
                                status={request.status}
                                text={t(`requests.status.${request.status}`)}
                            />
                        </td>
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
        <Container fluid className="admin-permanent-requests py-3">
            <PageHeader
                icon='clipboard-check'
                title={t('admin.requests.title')}
                badge={pendingRequests.length > 0 ? {
                    text: `${pendingRequests.length} ${t('admin.requests.pending')}`,
                    variant: 'warning'
                } : null}
            />

            {pendingRequests.length > 0 && (
                <Card className="mb-3">
                    <Card.Header className="bg-warning bg-opacity-10">
                        <h5 className="mb-0 justify-content-between d-flex align-items-center">
                            {t('admin.requests.pendingRequests')}
                            <Badge
                                bg="warning"
                                className="ms-2 rounded-pill"

                            >
                                {pendingRequests.length}
                            </Badge>
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

            {activeProcessedRequests.length > 0 && (
                <Card className="mb-3">
                    <Card.Header className="bg-success bg-opacity-10">
                        <h5 className="mb-0 justify-content-between d-flex align-items-center">
                            {t('admin.requests.activeRequests')}
                            <Badge
                                bg="success"
                                className="ms-2 rounded-pill bg-opacity-50"

                            >
                                {activeProcessedRequests.length}
                            </Badge>
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <RequestsTable
                            requests={sortedActiveRequests}
                            sortConfig={activeSortConfig}
                            requestSort={requestActiveSort}
                            isPending={false}
                        />
                    </Card.Body>
                </Card>
            )}

            {inactiveRequests.length > 0 && (
                <Card className="mt-3">
                    <Card.Header className="bg-secondary bg-opacity-10">
                        <h5 className="mb-0 justify-content-between d-flex align-items-center">
                            {t('admin.requests.inactiveRequests')}
                            <Badge
                                bg="secondary"
                                className="ms-2 rounded-pill bg-opacity-50"

                            >
                                {inactiveRequests.length}
                            </Badge>

                        </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <RequestsTable
                            requests={sortedInactiveRequests}
                            sortConfig={inactiveSortConfig}
                            requestSort={requestInactiveSort}
                            isPending={false}
                            isInactive={true}
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