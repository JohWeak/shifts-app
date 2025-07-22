// frontend/src/features/employee-dashboard/index.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useEmployeeData } from './hooks/useEmployeeData';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import './index.css';

const EmployeeDashboard = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const {
        schedule,
        constraints,
        dashboardStats,
        loadSchedule,
        setDashboardStats
    } = useEmployeeData();

    useEffect(() => {
        // Load initial data if not cached
        if (!schedule) {
            loadSchedule();
        }

        // Calculate dashboard stats
        if (schedule && !dashboardStats) {
            const stats = calculateDashboardStats(schedule);
            setDashboardStats(stats);
        }
    }, [schedule, dashboardStats, loadSchedule, setDashboardStats]);

    const calculateDashboardStats = (scheduleData) => {
        // Calculate various stats from schedule
        const today = new Date();
        const thisWeekShifts = scheduleData?.assignments?.filter(a => {
            const shiftDate = new Date(a.work_date);
            return shiftDate >= today && shiftDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        }) || [];

        return {
            thisWeekShifts: thisWeekShifts.length,
            nextShift: thisWeekShifts[0],
            totalHoursThisWeek: thisWeekShifts.reduce((sum, shift) => sum + (shift.duration || 8), 0),
            constraintsSubmitted: constraints?.isSubmitted || false
        };
    };

    const dashboardCards = [
        {
            id: 'schedule',
            title: t('employee.dashboard.mySchedule'),
            subtitle: t('employee.dashboard.viewWeeklySchedule'),
            icon: 'bi-calendar-week',
            color: 'primary',
            path: '/employee/schedule',
            stats: dashboardStats?.thisWeekShifts
                ? t('employee.dashboard.shiftsThisWeek', { count: dashboardStats.thisWeekShifts })
                : null
        },
        {
            id: 'constraints',
            title: t('employee.dashboard.constraints'),
            subtitle: t('employee.dashboard.submitPreferences'),
            icon: 'bi-shield-check',
            color: 'success',
            path: '/employee/constraints',
            stats: dashboardStats?.constraintsSubmitted
                ? t('employee.dashboard.submitted')
                : t('employee.dashboard.notSubmitted'),
            highlight: !dashboardStats?.constraintsSubmitted
        },
        {
            id: 'requests',
            title: t('employee.dashboard.requests'),
            subtitle: t('employee.dashboard.manageRequests'),
            icon: 'bi-envelope',
            color: 'warning',
            path: '/employee/requests',
            badge: 2 // TODO: Get from actual data
        },
        {
            id: 'archive',
            title: t('employee.dashboard.archive'),
            subtitle: t('employee.dashboard.viewHistory'),
            icon: 'bi-archive',
            color: 'info',
            path: '/employee/archive'
        }
    ];

    const handleCardClick = (path) => {
        navigate(path);
    };

    if (!dashboardStats && schedule === null) {
        return <LoadingState size="lg" message={t('common.loading')} />;
    }

    return (
        <Container className="employee-dashboard py-4">
            <div className="dashboard-header mb-4">
                <h2 className="mb-1">{t('employee.dashboard.welcome')}</h2>
                <p className="text-muted">{t('employee.dashboard.selectOption')}</p>
            </div>

            {dashboardStats?.nextShift && (
                <Card className="next-shift-card mb-4">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col>
                                <h5 className="mb-1">{t('employee.dashboard.nextShift')}</h5>
                                <p className="mb-0">
                                    <strong>{dashboardStats.nextShift.shift_name}</strong>
                                    {' - '}
                                    {new Date(dashboardStats.nextShift.work_date).toLocaleDateString()}
                                    {' '}
                                    ({dashboardStats.nextShift.start_time} - {dashboardStats.nextShift.end_time})
                                </p>
                            </Col>
                            <Col xs="auto">
                                <i className="bi bi-clock-history fs-1 text-primary"></i>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Row className="g-4">
                {dashboardCards.map(card => (
                    <Col key={card.id} xs={12} sm={6} lg={3}>
                        <Card
                            className={`dashboard-card h-100 ${card.highlight ? 'highlight' : ''}`}
                            onClick={() => handleCardClick(card.path)}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleCardClick(card.path);
                                }
                            }}
                        >
                            <Card.Body className="text-center">
                                <div className={`icon-wrapper bg-${card.color} bg-opacity-10 mb-3`}>
                                    <i className={`bi ${card.icon} text-${card.color}`}></i>
                                </div>
                                <h5 className="card-title mb-2">{card.title}</h5>
                                <p className="card-subtitle text-muted small mb-2">
                                    {card.subtitle}
                                </p>
                                {card.stats && (
                                    <p className={`stats mb-0 ${card.highlight ? 'text-danger' : 'text-success'}`}>
                                        <small>{card.stats}</small>
                                    </p>
                                )}
                                {card.badge && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        {card.badge}
                                    </span>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="mt-4">
                <Col md={6}>
                    <Card className="stats-card">
                        <Card.Body>
                            <h5 className="mb-3">{t('employee.dashboard.weekStats')}</h5>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">{t('employee.dashboard.totalHours')}</span>
                                    <span className="stat-value">{dashboardStats?.totalHoursThisWeek || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">{t('employee.dashboard.shiftsCount')}</span>
                                    <span className="stat-value">{dashboardStats?.thisWeekShifts || 0}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="quick-actions-card">
                        <Card.Body>
                            <h5 className="mb-3">{t('employee.dashboard.quickActions')}</h5>
                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={() => navigate('/employee/constraints')}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    {t('employee.dashboard.submitConstraints')}
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate('/employee/archive')}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    {t('employee.dashboard.downloadSchedule')}
                                </button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default EmployeeDashboard;