// frontend/src/features/employee-requests/index.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Button } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { addNotification } from 'app/model/notificationsSlice';
import { fetchMyRequests, addNewRequest } from './model/requestsSlice';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import PermanentConstraintForm from './ui/PermanentConstraintForm/PermanentConstraintForm';
import RequestsList from './ui/RequestsList/RequestsList';
import RequestDetails from './ui/RequestDetails/RequestDetails';
import './index.css';

const EmployeeRequests = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { items: requests, loading, loaded, error } = useSelector(state => state.requests);

    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Загружаем только если еще не загружено
        if (!loaded && !loading) {
            dispatch(fetchMyRequests());
        }
    }, [dispatch, loaded, loading]);

    const hasPendingRequest = requests.some(r => r.status === 'pending');
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const handleSubmitSuccess = (newRequest) => {
        setShowForm(false);
        // Добавляем новый запрос в Redux store
        dispatch(addNewRequest(newRequest));
        dispatch(addNotification({
            type: 'success',
            message: t('requests.submitSuccess')
        }));
    };

    const handleRequestClick = (request) => {
        setSelectedRequest(request);
    };

    const handleBackFromDetails = () => {
        setSelectedRequest(null);
    };

    const handleFabClick = () => {
        if (hasPendingRequest) {
            setShowTooltip(true);
            // Скрываем tooltip через 3 секунды
            setTimeout(() => setShowTooltip(false), 3000);
        } else {
            setShowForm(true);
        }
    };

    // Show request details if selected
    if (selectedRequest) {
        return (
            <RequestDetails
                request={selectedRequest}
                onBack={handleBackFromDetails}
            />
        );
    }

    // Show form if creating new request
    if (showForm) {
        return (
            <div className="employee-requests-container py-3">
                <PermanentConstraintForm
                    onSubmitSuccess={handleSubmitSuccess}
                    onCancel={() => setShowForm(false)}
                />
            </div>
        );
    }

    // Show requests list
    return (
        <Container className="employee-requests-container py-3">
            <PageHeader
                title={t('requests.title')}
                badge={pendingCount > 0 ? {
                    text: `${pendingCount} ${t('requests.pending')}`,
                    variant: 'info'
                } : null}
            />

            <Card>
                <Card.Body>
                    {loading && !loaded ? (
                        <LoadingState />
                    ) : error ? (
                        <EmptyState
                            icon="bi-exclamation-triangle"
                            title={t('common.error')}
                            message={error}
                            action={{
                                label: t('common.retry'),
                                onClick: () => dispatch(fetchMyRequests())
                            }}
                        />
                    ) : requests.length === 0 ? (
                        <EmptyState
                            icon="bi-inbox"
                            title={t('requests.noRequests')}
                            message={t('requests.noRequestsMessage')}
                        />
                    ) : (
                        <RequestsList
                            requests={requests}
                            onRequestClick={handleRequestClick}
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Floating Action Button */}
            <Button
                className="fab-button"
                variant={hasPendingRequest || loading ? "secondary" : "primary"}
                onClick={handleFabClick}
                disabled={loading}
                title={loading
                    ? t('common.loading')
                    : hasPendingRequest
                        ? t('requests.pendingRequestExists')
                        : t('requests.createNew')
                }
            >
                <i className="bi bi-plus-lg"></i>
            </Button>

            {/* Tooltip для заблокированной кнопки */}
            {showTooltip && hasPendingRequest && (
                <div className="fab-tooltip">
                    {t('requests.waitForPendingRequest')}
                </div>
            )}
        </Container>
    );
};

export default EmployeeRequests;