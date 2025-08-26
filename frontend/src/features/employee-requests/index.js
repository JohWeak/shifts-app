// frontend/src/features/employee-requests/index.js
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Button, Card, Container} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {addNotification} from 'app/model/notificationsSlice';
import {
    addNewRequest,
    deleteRequest,
    fetchMyPermanentConstraints,
    fetchMyRequests,
    markAsViewed,
    removeRequest,
    setRequestLoading,
    updateRequest
} from './model/requestsSlice';
import {constraintAPI} from 'shared/api/apiService';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import PermanentConstraintForm from './ui/PermanentConstraintForm/PermanentConstraintForm';
import RequestsList from './ui/RequestsList/RequestsList';
import RequestDetails from './ui/RequestDetails/RequestDetails';
import './index.css';

const EmployeeRequests = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const {items: requests, loading, loaded, error} = useSelector(state => state.requests);

    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);

    useEffect(() => {
        const loadRequests = async () => {
            if (!loaded && !loading) {
                await dispatch(fetchMyRequests());
                // Также загружаем permanent constraints
                await dispatch(fetchMyPermanentConstraints());
            }
        };

        void loadRequests();

        dispatch(markAsViewed());
    }, [dispatch, loaded, loading]);

    const validRequests = requests.filter(r => r && r.status);
    const hasPendingRequest = validRequests.some(r => r.status === 'pending');
    const pendingRequest = validRequests.find(r => r.status === 'pending');
    const pendingCount = validRequests.filter(r => r.status === 'pending').length;

    const handleSubmitSuccess = async (optimisticRequest, requestData, editingRequestId = null) => {
        setShowForm(false);

        try {
            if (editingRequestId) {
                // При редактировании показываем загрузку для существующего запроса
                dispatch(setRequestLoading(editingRequestId));

                // Удаляем старый запрос
                await dispatch(deleteRequest(editingRequestId)).unwrap();

                // Отправляем новый запрос
                const response = await constraintAPI.submitPermanentRequest(requestData);

                // Добавляем новый запрос
                dispatch(addNewRequest(response.data));

                dispatch(addNotification({
                    type: 'success',
                    message: t('requests.updateSuccess')
                }));
            } else {
                // Для нового запроса - существующая логика
                dispatch(addNewRequest(optimisticRequest));

                const response = await constraintAPI.submitPermanentRequest(requestData);

                dispatch(updateRequest({
                    tempId: optimisticRequest.id,
                    realRequest: response.data
                }));

                dispatch(addNotification({
                    type: 'success',
                    message: t('requests.submitSuccess')
                }));
            }
        } catch (error) {
            if (editingRequestId) {
                // При ошибке редактирования убираем индикатор загрузки
                dispatch(setRequestLoading(null));
                dispatch(fetchMyRequests());
            } else {
                dispatch(removeRequest(optimisticRequest.id));
            }

            const errorMessage = error.response?.data?.message || t('requests.submitError');
            dispatch(addNotification({
                type: 'error',
                message: errorMessage
            }));
        } finally {
            setEditingRequest(null);
        }
    };

    const handleEditRequest = (request) => {
        if (request.status !== 'pending') return;
        console.log('[EmployeeRequests] Editing request:', request);
        // Закрываем детали запроса, если они открыты
        setSelectedRequest(null);

        // Устанавливаем редактируемый запрос и открываем форму
        setEditingRequest(request);
        setShowForm(true);
    };

    const handleDeleteRequest = async (request) => {
        try {
            await dispatch(deleteRequest(request.id)).unwrap();

            // Если удаляем из деталей, закрываем их
            if (selectedRequest && selectedRequest.id === request.id) {
                setSelectedRequest(null);
            }

            dispatch(addNotification({
                type: 'success',
                message: t('requests.deleteSuccess')
            }));
        } catch (error) {
            dispatch(addNotification({
                type: 'error',
                message: t('requests.deleteError')
            }));
        }
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
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
            />
        );
    }

    // Show form if creating new request
    if (showForm) {
        return (
            <div className="employee-requests-container py-3">
                <PermanentConstraintForm
                    onSubmitSuccess={handleSubmitSuccess}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingRequest(null);
                    }}
                    initialData={editingRequest}
                />
            </div>
        );
    }

    // Show requests list
    return (
        <Container className="employee-requests-container py-3">
            <PageHeader
                icon="bi bi-envelope-fill"
                title={t('requests.title')}
                badge={pendingCount > 0 ? {
                    text: `${pendingCount} ${t('requests.pending')}`,
                    variant: 'info'
                } : null}
            />

            <Card className="employee-requests-card">
                <Card.Body>
                    {loading && !loaded ? (
                        <LoadingState/>
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
                    ) : validRequests.length === 0 ? (
                        <EmptyState
                            icon="bi-inbox"
                            title={t('requests.noRequests')}
                            message={t('requests.noRequestsMessage')}
                        />
                    ) : (
                        <RequestsList
                            requests={validRequests}
                            onRequestClick={handleRequestClick}
                            onEditRequest={handleEditRequest}
                            onDeleteRequest={handleDeleteRequest}
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

            {showTooltip && hasPendingRequest && (
                <div className="fab-tooltip">
                    {t('requests.waitForPendingRequest')}
                    {pendingRequest && (
                        <Button
                            size="sm"
                            variant="link"
                            className="text-white p-0 mt-1"
                            onClick={() => handleEditRequest(pendingRequest)}
                        >
                            {t('requests.editRequest')}
                        </Button>
                    )}
                </div>
            )}
        </Container>
    );
};

export default EmployeeRequests;