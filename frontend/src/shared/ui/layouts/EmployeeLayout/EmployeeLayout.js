// frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.js
import React, {useEffect, useState} from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {Container, Navbar, Nav, Spinner, Dropdown} from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {LanguageSwitch} from 'shared/ui/components/LanguageSwitch/LanguageSwitch';
import ThemeToggle from 'shared/ui/components/ThemeToggle/ThemeToggle';
import GlobalAlerts from 'shared/ui/components/GlobalAlerts/GlobalAlerts';
import { logout } from 'features/auth/model/authSlice';
import {
    fetchPersonalSchedule,
    fetchPositionSchedule,
    fetchEmployeeArchiveSummary,
    checkScheduleUpdates,
    fetchEmployeeConstraints,
} from "features/employee-dashboard/model/employeeDataSlice";
import { selectNewUpdatesCount, fetchMyRequests } from 'features/employee-requests/model/requestsSlice';
//import DebugReduxState from "../../components/DebugReduxState";

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
                const scheduleAction = await dispatch(fetchPersonalSchedule({})).unwrap();
                const weekStart = scheduleAction.data.current?.week?.start;

                if (weekStart) {
                    dispatch(fetchEmployeeConstraints({ weekStart }));
                }
                const positionId = scheduleAction.data.current?.employee?.position_id;
                if (positionId) {
                    dispatch(fetchPositionSchedule({ positionId }));
                }

                dispatch(fetchEmployeeArchiveSummary());
                dispatch(fetchMyRequests());
            } catch (error) {
                console.error("Error: ", error);
            }
        };

        void initialLoad();

        const intervalId = setInterval(() => {
            dispatch(checkScheduleUpdates());
        }, 30000);

        return () => clearInterval(intervalId);
    }, [dispatch]);

    const requests = useSelector(state => state.requests);
    const newRequestUpdates = useSelector(selectNewUpdatesCount);
    console.log('Dashboard - Requests state:', requests);
    console.log('Dashboard - newRequestUpdates:', newRequestUpdates);


    const navItems = [
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
        if (location.pathname === path) return;
        setIsAnimating(true);
        setTimeout(() => {
            navigate(path);
            setIsAnimating(false);
        }, 200);
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

                        <ThemeToggle variant='icon' />
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
                                        <span className="position-absolute top-5 start-100 translate-middle badge rounded-pill bg-danger"
                                              style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>
                                            {item.badge}
                                            <span className="visually-hidden">new updates</span>
                                        </span>
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
                    {/*{process.env.NODE_ENV === 'development' && <DebugReduxState />}*/}
                </Container>
            </main>
        </>
    );
};

export default EmployeeLayout;