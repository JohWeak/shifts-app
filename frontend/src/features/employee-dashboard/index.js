// frontend/src/features/employee-dashboard/index.js
import React, {useEffect} from 'react';
import {useSelector} from "react-redux";
import {useNavigate} from 'react-router-dom';
import {Container, Row, Col, Card} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useEmployeeData} from './hooks/useEmployeeData';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import PageHeader from "../../shared/ui/components/PageHeader/PageHeader";
import {useMediaQuery} from "../../shared/hooks/useMediaQuery";
import {selectNewUpdatesCount} from "../employee-requests/model/requestsSlice";
import './index.css';


const EmployeeDashboard = () => {
    const {t} = useI18n();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 567px)');
    const {
        personalSchedule,
        constraints,
        dashboardStats,
        loadConstraints,
        setDashboardStats,
    } = useEmployeeData();


    // Эффект: Загружаем ограничения, как только появляется расписание
    useEffect(() => {
        // Запускаем только если есть расписание и дата начала недели
        if (personalSchedule?.current?.week?.start) {
            loadConstraints(personalSchedule.current.week.start);
        }
    }, [personalSchedule, loadConstraints]);

    // Эффект для расчета статистики, когда данные (расписание или ограничения) обновляются
    useEffect(() => {
        // Пересчитываем статистику при обновлении расписания
        if (personalSchedule) {
            const stats = calculateDashboardStats(personalSchedule.current, constraints);
            setDashboardStats(stats);
        }
    }, [personalSchedule, constraints, setDashboardStats]);

    // --- ИЗМЕНЕННАЯ ФУНКЦИЯ ---
    const calculateDashboardStats = (scheduleData, constraintsResponse) => {
        // Определяем, были ли отправлены ограничения, используя ПРАВИЛЬНЫЙ ПУТЬ
        const areConstraintsSubmitted = constraintsResponse?.constraints?.already_submitted || false;

        if (!scheduleData || !Array.isArray(scheduleData.schedule)) {
            return {
                thisWeekShifts: 0,
                nextShift: null,
                totalHoursThisWeek: 0,
                constraintsSubmitted: areConstraintsSubmitted,
            };
        }

        const userAssignments = scheduleData.schedule.flatMap(day =>
            day.shifts
                .filter(shift => shift.employees.some(emp => emp.is_current_user))
                .map(shift => ({
                    work_date: day.date,
                    shift_name: shift.shift_name,
                    start_time: shift.start_time.substring(0, 5),
                    end_time: new Date(new Date(`1970-01-01T${shift.start_time}Z`).getTime() + shift.duration * 60 * 60 * 1000).toISOString().substr(11, 5),
                    duration: shift.duration,
                }))
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisWeekShifts = userAssignments.filter(a => {
            const shiftDate = new Date(a.work_date);
            return shiftDate >= today && shiftDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        });

        thisWeekShifts.sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

        return {
            thisWeekShifts: thisWeekShifts.length,
            nextShift: thisWeekShifts[0] || null,
            totalHoursThisWeek: thisWeekShifts.reduce((sum, shift) => sum + (shift.duration || 0), 0),
            constraintsSubmitted: areConstraintsSubmitted,
        };
    };

    const newRequestUpdates = useSelector(selectNewUpdatesCount);
    console.log('newRequestUpdates',newRequestUpdates);

    const dashboardCards = [
        {
            id: 'schedule',
            title: t('employee.dashboard.mySchedule'),
            subtitle: t('employee.dashboard.viewWeeklySchedule'),
            icon: 'bi-calendar-week',
            color: 'primary',
            path: '/employee/schedule',
            stats: dashboardStats?.thisWeekShifts
                ? t('employee.dashboard.shiftsThisWeek', {count: dashboardStats.thisWeekShifts})
                : t('employee.dashboard.noShifts'),
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
            badge: newRequestUpdates>0? newRequestUpdates : null,
            highlight: newRequestUpdates>0
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

    // Отображаем загрузку, пока не пришли данные И не посчитана статистика
    if (personalSchedule === null || dashboardStats === null) {
        return <LoadingState size="lg" message={t('common.loading')}/>;
    }

    return (
        <Container className="employee-dashboard py-2">
            <PageHeader
                className="dashboard-header mb-0 mb-md-3"
                icon="house-fill"
                title={t('employee.dashboard.welcome')}
                subtitle={t('employee.dashboard.selectOption')}
            />

            {dashboardStats?.nextShift && (
                <Card className="next-shift-card mb-2 mb-md-3">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col>
                                <h5 className="mb-1">{t('employee.dashboard.nextShift')}</h5>
                                <div className="mb-0 ">
                                    <strong>{dashboardStats.nextShift.shift_name}</strong>
                                    {' - '}
                                    {new Date(dashboardStats.nextShift.work_date).toLocaleDateString()}
                                    {' '}
                                    <p className="d-inline-block">
                                    ({dashboardStats.nextShift.start_time} - {dashboardStats.nextShift.end_time})
                                    </p>
                                </div>
                            </Col>
                            <Col xs="auto">
                                <i className="bi bi-clock-history fs-1 text-primary"></i>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Row className="g-2 g-md-3">
                {dashboardCards.map(card => (
                    <Col key={card.id} xs={6} sm={6} lg={3}>
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
                                {!isMobile && card.subtitle && (
                                    <p className="card-subtitle text-muted small mb-2">
                                        {card.subtitle}
                                    </p>
                                )}
                                {card.stats && (
                                    <p className={`stats mb-0 ${card.highlight ? 'text-danger' : 'text-success'}`}>
                                        <small>{card.stats}</small>
                                    </p>
                                )}
                                {card.badge && (
                                    <span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger dashboard-card-badge">
                                        {card.badge}
                                    </span>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="mt-2 mt-md-3 ">
                <Col md={12} xs={12}>
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
            </Row>
        </Container>
    );
};

export default EmployeeDashboard;