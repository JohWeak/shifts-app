// frontend/src/CompareAlgorithmsModal.js/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import AdminLayout from 'shared/ui/layouts/AdminLayout/AdminLayout';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';

import { Container, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {useI18n} from "shared/lib/i18n/i18nProvider";


import './index.css';

const AdminDashboard = () => {

    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();

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
            <Container fluid className="admin-dashboard px-0">
                <PageHeader
                    icon="speedometer2"
                    title={t('dashboard.dashboardTitle')}
                    subtitle={t('dashboard.dashboardDesc')}
                />

                <Row>
                    {/* 1. Карточка "Total Schedules" */}
                    <Col lg={3} md={6} className="mb-4">
                        {/* Добавляем класс dashboard-metric-card */}
                        <Card className="dashboard-metric-card h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    {/* Добавляем класс metric-icon */}
                                    <div className="metric-icon bg-primary bg-opacity-10 me-3">
                                        <i className="bi bi-calendar-week text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        {/* Добавляем классы metric-label и metric-value */}
                                        <div className="metric-label">{t('schedule.total')}</div>
                                        <div className="metric-value">{stats?.overview.total_schedules || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 2. Карточка "Published" */}
                    <Col lg={3} md={6} className="mb-4">
                        {/* Добавляем классы dashboard-metric-card и metric-success */}
                        <Card className="dashboard-metric-card metric-success h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="metric-icon bg-success bg-opacity-10 me-3">
                                        <i className="bi bi-check-circle text-success fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="metric-label">{t('schedule.published')}</div>
                                        <div className="metric-value">{stats?.overview.published_schedules || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 3. Карточка "Draft" */}
                    <Col lg={3} md={6} className="mb-4">
                        {/* Добавляем классы dashboard-metric-card и metric-warning */}
                        <Card className="dashboard-metric-card metric-warning h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="metric-icon bg-warning bg-opacity-10 me-3">
                                        <i className="bi bi-file-earmark text-warning fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="metric-label">{t('schedule.draft')}</div>
                                        <div className="metric-value">{stats?.overview.draft_schedules || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 4. Карточка "Total Assignments" */}
                    <Col lg={3} md={6} className="mb-4">
                        {/* Добавляем классы dashboard-metric-card и metric-info */}
                        <Card className="dashboard-metric-card metric-info h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="metric-icon bg-info bg-opacity-10 me-3">
                                        <i className="bi bi-people text-info fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="metric-label">{t('employee.totalAssignments')}</div>
                                        <div className="metric-value">{stats?.overview.total_assignments || 0}</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col lg={8} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header >
                                <h5 className="mb-0">{t('common.quickActions')}</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="primary"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/schedules')}
                                        >
                                            <i className="bi bi-calendar-week me-2"></i>
                                            {t('schedule.manageSchedules')}
                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-primary"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/employees')}
                                        >
                                            <i className="bi bi-people me-2"></i>
                                            {t('employee.manageEmployees')}                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-success"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/algorithms')}
                                        >
                                            <i className="bi bi-cpu me-2"></i>
                                            {t('settings.algorithmsSettings')}                                        </Button>
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Button
                                            variant="outline-info"
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => navigate('/admin/reports')}
                                        >
                                            <i className="bi bi-graph-up me-2"></i>
                                            {t('reports.viewReports')}
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4} className="mb-4">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header >
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

export default AdminDashboard;

