// frontend/src/features/employee-requests/index.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { constraintAPI } from 'shared/api/apiService';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { addNotification } from 'app/model/notificationsSlice';
import { useDispatch } from 'react-redux';
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

    // Calculate pending count
    const pendingCount = requests.filter(r => r.status === 'pending').length;

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
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <EmptyState
                            icon="bi-exclamation-triangle"
                            title={t('common.error')}
                            message={error}
                            action={{
                                label: t('common.retry'),
                                onClick: loadRequests
                            }}
                        />
                    ) : requests.length === 0 ? (
                        <EmptyState
                            icon={<i className="bi bi-inbox"></i>}
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
                variant="primary"
                onClick={() => setShowForm(true)}
                title={t('requests.create_new')}
            >
                <i className="bi bi-plus-lg"></i>
            </Button>
        </Container>
    );
};

export default EmployeeRequests;