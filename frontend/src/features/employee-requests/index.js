// frontend/src/features/employee-requests/index.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { constraintAPI } from '../../shared/api/apiService';
import { useI18n } from '../../shared/lib/i18n/i18nProvider';
import EmptyState from '../../shared/ui/components/EmptyState/EmptyState';
import LoadingState from '../../shared/ui/components/LoadingState/LoadingState';
import PermanentConstraintForm from './ui/PermanentConstraintForm/PermanentConstraintForm';
import RequestsList from './ui/RequestsList/RequestsList';
import RequestDetails from './ui/RequestDetails/RequestDetails';
import './index.css';

const EmployeeRequests = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
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
            const response = await constraintAPI.getMyPermanentRequests('my');
            setRequests(response.data || []);
        } catch (error) {
            console.error('Error loading requests:', error);
            setError(t('requests.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSuccess = () => {
        setShowForm(false);
        loadRequests();
        // Show success notification
        window.dispatchEvent(new CustomEvent('show-notification', {
            detail: {
                type: 'success',
                message: t('requests.submit_success')
            }
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

    // Show requests list
    return (
        <Container className="employee-requests-container py-3">
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">{t('requests.title')}</h4>
                    <Badge bg="info">
                        {requests.filter(r => r.status === 'pending').length} {t('requests.pending')}
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <EmptyState
                            icon={<i className="bi bi-exclamation-triangle"></i>}
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
                            title={t('requests.no_requests')}
                            message={t('requests.no_requests_message')}
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