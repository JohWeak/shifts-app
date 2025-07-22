// frontend/src/features/employee-requests/index.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Nav, Tab, Badge, Alert } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import { constraintAPI } from 'shared/api/apiService';
// import './index.css';

const EmployeeRequests = () => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('pending');
    const [requests, setRequests] = useState({
        pending: [],
        approved: [],
        rejected: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await constraintAPI.getPermanentRequests();

            // Group requests by status
            const grouped = {
                pending: [],
                approved: [],
                rejected: []
            };

            response.forEach(request => {
                if (grouped[request.status]) {
                    grouped[request.status].push(request);
                }
            });

            setRequests(grouped);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingState message={t('requests.loading')} />;
    }

    if (error) {
        return (
            <Container className="mt-4">
                <PageHeader title={t('requests.title')} />
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="employee-requests-container">
            <PageHeader
                icon="envelope"
                title={t('requests.title')}
                subtitle={t('requests.subtitle')}
            />

            <Card>
                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Card.Header>
                        <Nav variant="tabs">
                            <Nav.Item>
                                <Nav.Link eventKey="pending">
                                    {t('requests.pending')}
                                    {requests.pending.length > 0 && (
                                        <Badge bg="warning" className="ms-2">
                                            {requests.pending.length}
                                        </Badge>
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="approved">
                                    {t('requests.approved')}
                                    {requests.approved.length > 0 && (
                                        <Badge bg="success" className="ms-2">
                                            {requests.approved.length}
                                        </Badge>
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="rejected">
                                    {t('requests.rejected')}
                                    {requests.rejected.length > 0 && (
                                        <Badge bg="danger" className="ms-2">
                                            {requests.rejected.length}
                                        </Badge>
                                    )}
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>

                    <Card.Body>
                        <Tab.Content>
                            <Tab.Pane eventKey="pending">
                                {requests.pending.length === 0 ? (
                                    <Alert variant="info">
                                        {t('requests.noPending')}
                                    </Alert>
                                ) : (
                                    <div className="requests-list">
                                        {/* Render pending requests */}
                                    </div>
                                )}
                            </Tab.Pane>

                            <Tab.Pane eventKey="approved">
                                {requests.approved.length === 0 ? (
                                    <Alert variant="info">
                                        {t('requests.noApproved')}
                                    </Alert>
                                ) : (
                                    <div className="requests-list">
                                        {/* Render approved requests */}
                                    </div>
                                )}
                            </Tab.Pane>

                            <Tab.Pane eventKey="rejected">
                                {requests.rejected.length === 0 ? (
                                    <Alert variant="info">
                                        {t('requests.noRejected')}
                                    </Alert>
                                ) : (
                                    <div className="requests-list">
                                        {/* Render rejected requests */}
                                    </div>
                                )}
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Tab.Container>
            </Card>
        </Container>
    );
};

export default EmployeeRequests;