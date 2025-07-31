// frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.js
import React, {useEffect, useState} from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {Container, Navbar, Nav, Spinner, Dropdown, Badge} from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {LanguageSwitch} from 'shared/ui/components/LanguageSwitch/LanguageSwitch';
import ThemeToggle from 'shared/ui/components/ThemeToggle/ThemeToggle';
import GlobalAlerts from 'shared/ui/components/GlobalAlerts/GlobalAlerts';
import { logout } from 'features/auth/model/authSlice';
import { selectNewUpdatesCount } from 'features/employee-requests/model/requestsSlice';
import {
    fetchPersonalSchedule,
    fetchEmployeeArchiveSummary,
    checkScheduleUpdates,
    fetchEmployeeConstraints
} from "features/employee-dashboard/model/employeeDataSlice";

import './EmployeeLayout.css';

const EmployeeLayout = () => {
    const { isAuthenticated, loading, user } = useSelector(state => state.auth);
    const { t, direction } = useI18n();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isAnimating, setIsAnimating] = useState(false);


    useEffect(() => {
        const initialLoad = async () => {
            try {
                // --- ЭТАП 1: Загружаем критически важные данные ---
                console.log('[Data Preload] Загрузка персонального расписания...');
                // .unwrap() позволяет получить результат thunk или поймать ошибку
                const scheduleAction = await dispatch(fetchPersonalSchedule({})).unwrap();

                // Данные о расписании нужны для загрузки ограничений
                const weekStart = scheduleAction.data.current?.week?.start;
                if (weekStart) {
                    console.log('[Data Preload] Загрузка ограничений...');
                    dispatch(fetchEmployeeConstraints({ weekStart }));
                }

                // --- ЭТАП 2: В фоне загружаем важные, но не критические данные ---
                console.log('[Data Preload] Фоновая загрузка сводки по архиву...');
                dispatch(fetchEmployeeArchiveSummary());

                // Сюда можно добавить загрузку сводки по запросам, если она появится
                // dispatch(fetchRequestsSummary());

            } catch (error) {
                console.error("Ошибка при первоначальной загрузке данных:", error);
            }
        };

        // Запускаем асинхронную загрузку
        initialLoad();

        // --- Периодическая проверка обновлений расписания (остается без изменений) ---
        const intervalId = setInterval(() => {
            dispatch(checkScheduleUpdates());
        }, 30000);

        return () => clearInterval(intervalId);

    }, [dispatch]);

    const newRequestUpdates = useSelector(selectNewUpdatesCount);

    const navItems = [
        // Добавляем вторую иконку с суффиксом -fill
        { path: '/employee/dashboard', icon: 'house', iconFill: 'house-fill', label: t('navigation.home') },
        { path: '/employee/schedule', icon: 'calendar-week', iconFill: 'calendar-week-fill', label: t('employee.schedule.tabName') },
        { path: '/employee/constraints', icon: 'shield-check', iconFill: 'shield-fill-check', label: t('employee.constraints') },
        {
            path: '/employee/requests',
            icon: 'envelope',
            iconFill: 'envelope-fill',
            label: t('employee.requests.title'),
            badge: newRequestUpdates > 0 ? newRequestUpdates : null
        },
        { path: '/employee/archive', icon: 'archive', iconFill: 'archive-fill', label: t('employee.archive.title') },
    ];

    const handleNavigation = (path) => {
        // Если мы уже на этой странице, ничего не делаем
        if (location.pathname === path) return;

        // 1. Запускаем анимацию "исчезновения"
        setIsAnimating(true);

        // 2. Ждем завершения анимации и только потом меняем маршрут
        setTimeout(() => {
            navigate(path);
            // 3. Сбрасываем флаг анимации после перерисовки
            setIsAnimating(false);
        }, 200); // Это время должно совпадать с длительностью анимации в CSS
    };

    const handleLogoClick = () => {
        navigate('/employee/dashboard');
    };
    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <button
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            className="user-menu-toggle"
        >
            {children}
        </button>
    ));

    if (loading === 'pending') {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            {/* Header */}
            <Navbar bg="primary" variant="dark" expand={false} fixed="top" className="employee-navbar">
                <Container fluid >
                    <Navbar.Brand
                        onClick={handleLogoClick}
                        style={{ cursor: 'pointer' }}
                        className="d-flex align-items-center"
                    >
                        <div className="app-name">
                            <i className="bi bi-calendar-check me-2"></i>
                            <span className="d-none d-sm-inline">{t('app.name')}</span>
                        </div>
                    </Navbar.Brand>

                    <div className="d-flex align-items-center gap-2">
                        {/* Theme Toggle */}
                        <ThemeToggle variant='icon' />

                        {/* Language Switch */}
                        <LanguageSwitch />

                        {/* User Menu */}
                        <Dropdown align={direction === 'rtl' ? 'start' : 'end'}>
                            <Dropdown.Toggle as={CustomToggle}>
                                <div className="user-avatar">
                                    <i className="bi bi-person-circle"></i>
                                </div>
                                <span className="user-name d-none d-md-inline ms-2">
                                    {user?.name || user?.email}
                                </span>
                                <i className="bi bi-chevron-down ms-1"></i>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="user-dropdown-menu">
                                <Dropdown.Header>
                                    <div className="user-info">
                                        <strong>{user?.name || user?.email}</strong>
                                        <small className="text-muted d-block">{user?.role}</small>
                                    </div>
                                </Dropdown.Header>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => navigate('/employee/profile')}>
                                    <i className="bi bi-person me-2"></i>
                                    {t('employee.profile')}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate('/employee/settings')}>
                                    <i className="bi bi-gear me-2"></i>
                                    {t('employee.settings')}
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    {t('auth.logout')}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Container>
            </Navbar>

            {/* Navigation Tabs */}
            <Nav justify className="employee-nav-tabs">
                <Container fluid className="px-0">
                    <div className="nav-tabs-wrapper">
                        {navItems.map(item => (
                            <Nav.Link
                                key={item.path}
                                className={`nav-tab-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => handleNavigation(item.path)}
                            >
                                <span className="icon-wrapper">
                                    <i className={`bi bi-${item.icon} icon-outline`}></i>
                                    <i className={`bi bi-${item.iconFill} icon-fill`}></i>
                                    {item.badge && (
                                        <Badge
                                            pill
                                            bg="danger"
                                            className="position-absolute"
                                            style={{
                                                top: '-5px',
                                                right: '-10px',
                                                fontSize: '0.65rem'
                                            }}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                </span>
                                <span>{item.label}</span>
                            </Nav.Link>
                        ))}
                    </div>
                </Container>
            </Nav>

            {/* Main Content */}
            <main className={`employee-main-content ${isAnimating ? 'animating-out' : 'animating-in'}`}>
                <Container fluid className="px-0">
                    <GlobalAlerts />
                    <Outlet />
                </Container>
            </main>
        </>
    );
};

export default EmployeeLayout;