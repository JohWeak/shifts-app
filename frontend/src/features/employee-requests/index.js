// frontend/src/features/employee-requests/index.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { Inbox, ExclamationTriangle } from 'react-bootstrap-icons';
import { constraintAPI } from 'shared/api/apiService';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { addNotification } from 'app/model/notificationsSlice';
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
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await constraintAPI.getMyPermanentRequests();
            setRequests(response.data || []);
        } catch (error) {
            console.error('Error loading requests:', error);
            setError(t('requests.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSuccess = () => {
        setShowForm(false);
        loadRequests();
        dispatch(addNotification({
            variant: 'success', // Убедимся, что variant передается правильно
            message: t('requests.submitSuccess')
        }));
    };

    const handleRequestClick = (request) => setSelectedRequest(request);
    const handleBackFromDetails = () => setSelectedRequest(null);

    const renderContent = () => {
        if (loading) {
            return <LoadingState />;
        }

        if (error) {
            return (
                <EmptyState
                    icon={<ExclamationTriangle />} // Передаем компонент иконки
                    title={t('common.error')}
                    description={error}
                    actionLabel={t('common.retry')}
                    onAction={loadRequests}
                />
            );
        }

        if (requests.length === 0) {
            return (
                <EmptyState
                    icon={<Inbox />} // Передаем компонент иконки
                    title={t('requests.noRequests')}
                    description={t('requests.noRequestsMessage')}
                />
            );
        }

        // Только если все проверки пройдены, рендерим карточку со списком
        return (
            <Card>
                <Card.Body>
                    <RequestsList
                        requests={requests}
                        onRequestClick={handleRequestClick}
                    />
                </Card.Body>
            </Card>
        );
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

    // Show form if creating a new request
    if (showForm) {
        return (
            <div className="employee-requests-container p-2">
                <PermanentConstraintForm
                    onSubmitSuccess={handleSubmitSuccess}
                    onCancel={() => setShowForm(false)}
                />
            </div>
        );
    }

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    // Show the requests list
    return (
        <Container className="employee-requests-container py-3 ">
            <PageHeader
                title={t('requests.title')}
                icon="envelope-fill"
                badge={pendingCount > 0 ? {
                    text: `${pendingCount} ${t('requests.pending')}`,
                    variant: 'info'
                } : null}
            />
            <div className="mt-3">
                {renderContent()}
            </div>

            {/* Floating Action Button */}
            <Button
                className="fab-button"
                variant="primary"
                onClick={() => setShowForm(true)}
                title={t('requests.createNew')}
            >
                <i className="bi bi-plus-lg"></i>
            </Button>
        </Container>
    );
};

export default EmployeeRequests;