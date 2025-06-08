// frontend/src/components/admin/Dashboard.js - ОБНОВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Container, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/schedules/stats/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                <div className="mb-4">
                    <h1 className="h3 mb-2 text-dark fw-bold">
                        <i className="bi bi-speedometer2 me-2 text-primary"></i>
                        Dashboard Overview
                    </h1>
                    <p className="text-muted mb-0">Quick overview of your scheduling system</p>
                </div>

                <Row>
                    <Col lg={3} md={6} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                                        <i className="bi bi-calendar-week text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="text-muted small">Total Schedules</div>
                                        <div className="h4 mb-0">{stats?.overview.total_schedules || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                                        <i className="bi bi-check-circle text-success fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="text-muted small">Published</div>
                                        <div className="h4 mb-0">{stats?.overview.published_schedules || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-10 rounded p-3 me-3">
                                        <i className="bi bi-file-earmark text-warning fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="text-muted small">Draft</div>
                                        <div className="h4 mb-0">{stats?.overview.draft_schedules || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="bg-info bg-opacity-10 rounded p-3 me-3">
                                        <i className="bi bi-people text-info fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="text-muted small">Total Assignments</div>
                                        <div className="h4 mb-0">{stats?.overview.total_assignments || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col lg={8} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-light border-0">
                                <h5 className="mb-0">Quick Actions</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="primary"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/schedules/list')}
                                        >
                                            <i className="bi bi-calendar-week me-2"></i>
                                            Manage Schedules
                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-primary"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/employees')}
                                        >
                                            <i className="bi bi-people me-2"></i>
                                            Manage Employees
                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-success"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/algorithms')}
                                        >
                                            <i className="bi bi-cpu me-2"></i>
                                            Algorithm Settings
                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-info"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/reports')}
                                        >
                                            <i className="bi bi-graph-up me-2"></i>
                                            View Reports
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-light border-0">
                                <h5 className="mb-0">System Status</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="small">Scheduling Service</span>
                                        <Badge bg="success">Online</Badge>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="small">CP-SAT Algorithm</span>
                                        <Badge bg="success">Available</Badge>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="small">Database</span>
                                        <Badge bg="success">Connected</Badge>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </AdminLayout>
    );
};

export default Dashboard;