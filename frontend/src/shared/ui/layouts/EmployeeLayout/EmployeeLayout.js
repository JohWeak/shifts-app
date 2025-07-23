// frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.js
import React, {useEffect, useState} from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, Spinner, Dropdown } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {LanguageSwitch} from 'shared/ui/components/LanguageSwitch/LanguageSwitch';
import ThemeToggle from 'shared/ui/components/ThemeToggle/ThemeToggle';
import GlobalAlerts from 'shared/ui/components/GlobalAlerts/GlobalAlerts';
import { logout } from 'features/auth/model/authSlice';
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
    const [showNav, setShowNav] = useState(false);


    // Check if we're on dashboard
    const isDashboard = location.pathname === '/employee/dashboard';

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

    const navItems = [
        { path: '/employee/dashboard', icon: 'house', label: t('dashboard.title') },
        { path: '/employee/schedule', icon: 'calendar-week', label: t('employee.schedule.title') },
        { path: '/employee/constraints', icon: 'shield-check', label: t('employee.constraints') },
        { path: '/employee/requests', icon: 'envelope', label: t('employee.requests.title') },
        { path: '/employee/archive', icon: 'archive', label: t('employee.archive.title') },
    ];
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
                <Container fluid className='mx-1'>
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
            <Nav className="employee-nav-tabs">
                <Container fluid className="px-0">
                    <div className="nav-tabs-wrapper">
                        {navItems.map(item => (
                            <Nav.Link
                                key={item.path}
                                className={`nav-tab-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <i className={`bi bi-${item.icon} me-2`}></i>
                                <span>{item.label}</span>
                            </Nav.Link>
                        ))}
                    </div>
                </Container>
            </Nav>

            {/* Main Content */}
            <main className={`employee-main-content ${isDashboard ? 'dashboard-view' : ''}`}>
                <Container fluid>
                    <GlobalAlerts />
                    <Outlet />
                </Container>
            </main>
        </>
    );
};

export default EmployeeLayout;