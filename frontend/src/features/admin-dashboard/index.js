// frontend/src/features/admin-dashboard/index.js
import React, {useEffect, useState} from 'react';
import {Badge, Button, Card, Col, Container, Row} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import MetricCard from './components/MetricCard';
import {fetchEmployees} from 'features/admin-employee-management/model/employeeSlice';
import {fetchSchedules} from 'features/admin-schedule-management/model/scheduleSlice';
import {fetchPositions, fetchWorkSites} from 'features/admin-workplace-settings/model/workplaceSlice';
import './AdminDashboard.css';
import PageHeader from '../../shared/ui/components/PageHeader';

/**
 * Admin Dashboard Component
 * Provides system overview with metrics, quick actions and status
 */
const AdminDashboard = () => {
    const {t} = useI18n();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux state
    const {user} = useSelector(state => state.auth);
    const {employees, loading: employeesLoading} = useSelector(state => state.employees);
    const {schedules} = useSelector(state => state.schedule);
    const {positions, workSites} = useSelector(state => state.workplace);

    // Check if current user is super admin
    const isSuperAdmin = user && (user.emp_id === 1 || user.is_super_admin);
    const accessibleSites = isSuperAdmin ? 'all' : (user?.admin_work_sites_scope || []);

    // Local state
    const [metrics, setMetrics] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        totalWorkSites: 0,
        activeWorkSites: 0,
        totalPositions: 0,
        activePositions: 0,
        publishedSchedules: 0,
        pendingRequests: 0,
    });

    // Load data on mount
    useEffect(() => {
        dispatch(fetchEmployees());
        dispatch(fetchWorkSites());
        dispatch(fetchPositions());
        dispatch(fetchSchedules());
    }, [dispatch]);

    // Calculate metrics when data changes
    useEffect(() => {
        // Filter positions and sites based on access rights for restricted admins
        const filteredPositions = positions?.filter(position => {
            if (isSuperAdmin || accessibleSites === 'all') return true;
            return accessibleSites.includes(position.site_id);
        }) || [];

        const filteredWorkSites = workSites?.filter(site => {
            if (isSuperAdmin || accessibleSites === 'all') return true;
            return accessibleSites.includes(site.site_id);
        }) || [];

        setMetrics({
            totalEmployees: employees?.length || 0,
            activeEmployees: employees?.filter(e => e.status === 'active').length || 0,
            totalWorkSites: filteredWorkSites.length,
            activeWorkSites: filteredWorkSites.filter(s => s.is_active).length,
            totalPositions: filteredPositions.length,
            activePositions: filteredPositions.filter(p => p.is_active).length,
            publishedSchedules: schedules?.filter(s => s.status === 'published').length || 0,
            pendingRequests: 0,
        });
    }, [employees, workSites, positions, schedules, isSuperAdmin, accessibleSites]);

    const isLoading = employeesLoading;

    return (
        <div className="admin-dashboard">
            <Container fluid>
                {/* Header */}
                <Row className="mb-2">
                    <Col>
                        <PageHeader
                            icon="speedometer2"
                            title={`${t('dashboard.welcomeBack')}, ${user?.first_name || 'Admin'}!`}
                            subtitle={t('dashboard.dashboardDesc')}
                        />
                    </Col>
                </Row>

                {/* Metrics Grid */}
                <Row className="g-3 mb-4">
                    <Col xs={6} md={4} lg={3}>
                        <MetricCard
                            icon="bi-people-fill"
                            value={metrics.activeEmployees}
                            label={t('dashboard.metrics.activeEmployees')}
                            color="primary"
                            onClick="/admin/employees"
                            loading={isLoading}
                        />
                    </Col>
                    <Col xs={6} md={4} lg={3}>
                        <MetricCard
                            icon="bi-building"
                            value={metrics.activeWorkSites}
                            label={t('dashboard.metrics.activeWorkSites')}
                            color="success"
                            onClick="/admin/workplace"
                            loading={isLoading}
                        />
                    </Col>
                    <Col xs={6} md={4} lg={3}>
                        <MetricCard
                            icon="bi-briefcase-fill"
                            value={metrics.activePositions}
                            label={t('dashboard.metrics.activePositions')}
                            color="info"
                            onClick={{
                                pathname: '/admin/workplace',
                                state: {initialTab: 'positions'}
                            }}
                            loading={isLoading}
                        />
                    </Col>
                    <Col xs={6} md={4} lg={3}>
                        <MetricCard
                            icon="bi-calendar-check-fill"
                            value={metrics.publishedSchedules}
                            label={t('dashboard.metrics.publishedSchedules')}
                            color="warning"
                            onClick="/admin/schedules"
                            loading={isLoading}
                        />
                    </Col>
                </Row>

                <Row className="g-3">
                    {/* Quick Actions */}
                    <Col lg={8}>
                        <Card className="action-card h-100">
                            <Card.Header className="bg-transparent">
                                <h5 className="mb-0">
                                    <i className="bi bi-lightning-charge-fill me-2 text-primary"/>
                                    {t('dashboard.quickActions.title')}
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col sm={6} md={4}>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="w-100 action-button"
                                            onClick={() => navigate('/admin/schedules')}
                                        >
                                            <i className="bi bi-calendar-plus"/>
                                            <span>{t('dashboard.quickActions.createSchedule')}</span>
                                        </Button>
                                    </Col>
                                    <Col sm={6} md={4}>
                                        <Button
                                            variant="outline-primary"
                                            size="lg"
                                            className="w-100 action-button"
                                            onClick={() => navigate('/admin/employees')}
                                        >
                                            <i className="bi bi-person-plus"/>
                                            <span>{t('dashboard.quickActions.manageEmployees')}</span>
                                        </Button>
                                    </Col>
                                    <Col sm={6} md={4}>
                                        <Button
                                            variant="outline-success"
                                            size="lg"
                                            className="w-100 action-button"
                                            onClick={() => navigate('/admin/reports')}
                                        >
                                            <i className="bi bi-graph-up"/>
                                            <span>{t('dashboard.quickActions.viewReports')}</span>
                                        </Button>
                                    </Col>
                                    <Col sm={6} md={4}>
                                        <Button
                                            variant="outline-info"
                                            size="lg"
                                            className="w-100 action-button"
                                            onClick={() => navigate('/admin/workplace')}
                                        >
                                            <i className="bi bi-building-gear"/>
                                            <span>{t('dashboard.quickActions.workplaceSettings')}</span>
                                        </Button>
                                    </Col>
                                    <Col sm={6} md={4}>
                                        <Button
                                            variant="outline-warning"
                                            size="lg"
                                            className="w-100 action-button"
                                            onClick={() => navigate('/admin/algorithms')}
                                        >
                                            <i className="bi bi-cpu"/>
                                            <span>{t('dashboard.quickActions.algorithmSettings')}</span>
                                        </Button>
                                    </Col>
                                    <Col sm={6} md={4}>
                                        <Button
                                            variant="outline-secondary"
                                            size="lg"
                                            className="w-100 action-button"
                                            onClick={() => navigate('/admin/settings')}
                                        >
                                            <i className="bi bi-gear"/>
                                            <span>{t('dashboard.quickActions.systemSettings')}</span>
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* System Status */}
                    <Col lg={4}>
                        <Card className="status-card h-100">
                            <Card.Header className="bg-transparent">
                                <h5 className="mb-0">
                                    <i className="bi bi-activity me-2 text-success"/>
                                    {t('dashboard.systemStatus.title')}
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="status-list">
                                    <div className="status-item">
                                        <span className="status-label">
                                            {t('dashboard.systemStatus.schedulingService')}
                                        </span>
                                        <Badge bg="success" className="status-badge">
                                            {t('dashboard.systemStatus.online')}
                                        </Badge>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">
                                            {t('dashboard.systemStatus.algorithm')}
                                        </span>
                                        <Badge bg="success" className="status-badge">
                                            {t('dashboard.systemStatus.available')}
                                        </Badge>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">
                                            {t('dashboard.systemStatus.database')}
                                        </span>
                                        <Badge bg="success" className="status-badge">
                                            {t('dashboard.systemStatus.connected')}
                                        </Badge>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">
                                            {t('dashboard.systemStatus.apiServices')}
                                        </span>
                                        <Badge bg="success" className="status-badge">
                                            {t('dashboard.systemStatus.online')}
                                        </Badge>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AdminDashboard;