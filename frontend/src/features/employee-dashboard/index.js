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
        setDashboardStats, // Убедимся, что эта функция передается из хука
    } = useEmployeeData();

    useEffect(() => {
        // Загружаем расписание, если его нет в кеше
        if (!schedule) {
            loadSchedule();
        }
    }, [schedule, loadSchedule]);


    useEffect(() => {
        // Пересчитываем статистику при обновлении расписания
        if (schedule) {
            const stats = calculateDashboardStats(schedule);
            setDashboardStats(stats);
        }
        // Зависимость от schedule гарантирует пересчет при его изменении
    }, [schedule, setDashboardStats]);


    // --- ИЗМЕНЕННАЯ ФУНКЦИЯ ---
    const calculateDashboardStats = (scheduleData) => {
        // 1. Проверяем, что данные от API существуют и содержат массив 'schedule'
        if (!scheduleData || !Array.isArray(scheduleData.schedule)) {
            return {
                thisWeekShifts: 0,
                nextShift: null,
                totalHoursThisWeek: 0,
                constraintsSubmitted: constraints?.isSubmitted || false,
            };
        }

        // 2. Преобразуем вложенную структуру API в плоский массив смен ТОЛЬКО для текущего пользователя
        const userAssignments = scheduleData.schedule.flatMap(day =>
            day.shifts
                // Находим смены, где текущий пользователь назначен
                .filter(shift => shift.employees.some(emp => emp.is_current_user))
                // Создаем новый объект смены в нужном нам формате
                .map(shift => ({
                    work_date: day.date, // Берем дату из родительского объекта дня
                    shift_name: shift.shift_name,
                    start_time: shift.start_time.substring(0, 5), // Форматируем время
                    // Рассчитываем время окончания, если его нет
                    end_time: new Date(new Date(`1970-01-01T${shift.start_time}Z`).getTime() + shift.duration * 60 * 60 * 1000).toISOString().substr(11, 5),
                    duration: shift.duration,
                }))
        );

        // 3. Фильтруем смены, чтобы остались только будущие на ближайшие 7 дней
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня для корректного сравнения

        const thisWeekShifts = userAssignments.filter(a => {
            const shiftDate = new Date(a.work_date);
            return shiftDate >= today && shiftDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        });

        // 4. Сортируем смены, чтобы найти ближайшую
        thisWeekShifts.sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

        // 5. Возвращаем рассчитанную статистику
        return {
            thisWeekShifts: thisWeekShifts.length,
            nextShift: thisWeekShifts[0] || null, // Берем первую смену после сортировки
            totalHoursThisWeek: thisWeekShifts.reduce((sum, shift) => sum + (shift.duration || 0), 0),
            constraintsSubmitted: constraints?.isSubmitted || false,
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
                : t('employee.dashboard.noShifts'), // Добавим сообщение, если смен нет
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

    // Отображаем загрузку, пока не пришли данные И не посчитана статистика
    if (schedule === null || dashboardStats === null) {
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