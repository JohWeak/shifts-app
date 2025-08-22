// frontend/src/shared/ui/layouts/AdminLayout/AdminLayout.js
import React, {useState, useEffect, useRef} from 'react';
import {Outlet} from 'react-router-dom';
import {
    Container,
    Navbar,
    Nav,
    Dropdown,
    Button,
    Badge
} from 'react-bootstrap';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {logout} from 'features/auth/model/authSlice';
import {LanguageSwitch} from '../../components/LanguageSwitch/LanguageSwitch';
import {useI18n} from "shared/lib/i18n/i18nProvider";

import GlobalAlerts from 'shared/ui/components/GlobalAlerts/GlobalAlerts';
import ThemeToggle from 'shared/ui/components/ThemeToggle/ThemeToggle';
import {
    fetchSchedules, resetScheduleView,
    setSelectedScheduleId
} from 'features/admin-schedule-management/model/scheduleSlice';
import {fetchAllRequests} from 'features/admin-permanent-requests/model/adminRequestsSlice';
import './AdminLayout.css';
import {addNotification} from "../../../../app/model/notificationsSlice";

const AdminLayout = () => {
    const {t} = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const dispatch = useDispatch();
    const {pendingCount} = useSelector(state => state.adminRequests);
    const sidebarRef = useRef(null);
    const expandTimeoutRef = useRef(null);

    useEffect(() => {
        // Preload current week schedules on app init
        const preloadData = async () => {
            try {
                await dispatch(fetchAllRequests()).unwrap();
                await dispatch(fetchSchedules()).unwrap();
            } catch (error) {
                console.error('Failed to preload data:', error);
            }
        };
        preloadData();
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Handle mouse enter/leave for sidebar expansion (only on button)
    const handleButtonMouseEnter = () => {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = setTimeout(() => {
            setIsSidebarExpanded(true);
        }, 100);
    };

    const handleSidebarMouseLeave = () => {
        clearTimeout(expandTimeoutRef.current);
        setIsSidebarExpanded(false);
    };

    // Toggle sidebar on button click
    const handleToggleClick = () => {
        setIsSidebarExpanded(prev => !prev);
    };

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (expandTimeoutRef.current) {
                clearTimeout(expandTimeoutRef.current);
            }
        };
    }, []);

    const navigationItems = [
        {
            key: 'dashboard',
            label: t('navigation.dashboard'),
            icon: 'speedometer2',
            path: '/admin',
            badge: null
        },
        {
            key: 'schedules',
            label: t('navigation.schedules'),
            icon: 'calendar-week',
            path: '/admin/schedules',
            badge: t('common.new')
        },
        {
            key: 'algorithms',
            label: t('navigation.algorithms'),
            icon: 'cpu-fill',
            path: '/admin/algorithms',
            badge: null
        },
        {
            key: 'employees',
            label: t('navigation.employees'),
            icon: 'people-fill',
            path: '/admin/employees',
            badge: null
        },
        {
            key: 'workplace',
            label: t('navigation.workplace'),
            icon: 'building',
            path: '/admin/workplace',
            badge: null
        },
        {
            key: 'reports',
            label: t('navigation.reports'),
            icon: 'graph-up-arrow',
            path: '/admin/reports',
            badge: null
        },
        {
            key: 'requests',
            label: t('navigation.requests'),
            icon: 'clipboard-check',
            path: '/admin/permanent-requests',
            badge: pendingCount > 0 ? pendingCount : null
        },
    ];

    const currentPath = location.pathname;
    const isActive = (path) => {
        if (path === '/admin') {
            return currentPath === '/admin';
        }
        return currentPath.startsWith(path);
    };

    const handleNavigation = (path) => {
        if (path === '/admin/schedules') {
            dispatch(resetScheduleView());
        }
        navigate(path);
    };

    const SidebarContent = ({ isCompact = false }) => (
        <Nav className="flex-column admin-nav">
            {navigationItems.map(item => (
                <Nav.Item key={item.key}>
                    <Nav.Link
                        as={Link}
                        to={item.path}
                        className={`admin-nav-link ${isCompact ? 'compact' : ''} ${isActive(item.path) ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigation(item.path);
                        }}
                        title={isCompact && !isSidebarExpanded ? item.label : undefined}
                    >
                        <i className={`bi bi-${item.icon} nav-icon`}></i>
                        <span className={`nav-label ${isCompact && !isSidebarExpanded ? 'compact-label' : ''}`}>
                            {isSidebarExpanded ? item.label : item.label}
                        </span>
                        {item.badge && (
                            <Badge
                                bg="danger"
                                className={isCompact && !isSidebarExpanded ? 'compact-badge' : ''}
                            >
                                {item.badge}
                            </Badge>
                        )}
                    </Nav.Link>
                </Nav.Item>
            ))}
        </Nav>
    );

    return (
        <div className="admin-layout">
            {/* Top Navigation Bar */}
            <Navbar className="admin-navbar shadow-sm sticky-top">
                <Container fluid className="px-3">
                    <div className="d-flex align-items-center">
                        {/* Sidebar Toggle Button - Now always visible */}
                        <Button
                            className={`sidebar-menu-btn ${isSidebarExpanded ? 'active' : ''}`}
                            onClick={handleToggleClick}

                        >
                            <i className="bi bi-list"></i>
                        </Button>

                        <Navbar
                            as={Link}
                            to="/admin"
                            className="brand-logo mb-0"
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigation('/admin');
                            }}
                        >
                            <i className="bi bi-calendar-check-fill text-primary me-2"></i>
                            <span className="brand-text">{t('common.appName')}</span>
                            <Badge bg="secondary" className="ms-2 brand-badge">{t('common.admin')}</Badge>
                        </Navbar>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="success"
                            className="btn-sm"
                            onClick={() => dispatch(addNotification({
                                variant: 'success',
                                message: 'successMessage',
                            }))
                        }
                        >
                            <i className="bi bi-bell-fill"></i>
                        </Button>
                        <Button
                            variant="warning"
                            className="btn-sm"
                            onClick={() => dispatch(addNotification({
                                variant: 'warning',
                                message: 'warningMessage',
                            }))
                            }
                        >
                            <i className="bi bi-bell-fill"></i>
                        </Button>
                        <Button
                            variant="danger"
                            className="btn-sm"
                            onClick={() => dispatch(addNotification({
                                variant: 'danger',
                                message: 'dangerMessage',
                            }))
                            }
                        >
                            <i className="bi bi-bell-fill"></i>
                        </Button>
                        <Button
                            variant="info"
                            className="btn-sm"
                            onClick={() => dispatch(addNotification({
                                variant: 'info',
                                message: 'infoMessage',
                            }))
                            }
                        >
                            <i className="bi bi-bell-fill"></i>
                        </Button>
                        <ThemeToggle variant="icon"/>
                        <LanguageSwitch/>

                        <Dropdown align="end" className='ms-1'>
                            <Dropdown.Toggle
                                className="user-dropdown-btn border-0 shadow-sm"
                                id="user-dropdown"
                            >
                                <div className="d-flex align-items-center">
                                    <div className="user-avatar mt-3">
                                        <i className="bi bi-person-circle"></i>
                                    </div>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="user-dropdown-menu shadow">
                                <Dropdown.Header>
                                    <div className="text-muted small">{t('auth.signedInAs')}</div>
                                    <div className="fw-semibold">{t('common.admin')}</div>
                                </Dropdown.Header>
                                <Dropdown.Divider/>
                                <Dropdown.Item>
                                    <i className="bi bi-person me-2"></i>
                                    {t('common.profile')}
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <i className="bi bi-gear me-2"></i>
                                    {t('common.settings')}
                                </Dropdown.Item>
                                <Dropdown.Divider/>
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    {t('auth.logout')}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Container>
            </Navbar>

            {/* Main Container */}
            <div className="admin-main-container">
                {/* Sidebar - Always compact, expands on hover/click */}
                <div
                    ref={sidebarRef}
                    className={`admin-sidebar-desktop ${isSidebarExpanded ? 'expanded' : 'compact'}`}
                    onMouseLeave={handleSidebarMouseLeave}
                >
                    <div className="sidebar-content">
                        <SidebarContent isCompact={true} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`admin-content-area ${isSidebarExpanded ? 'under-sidebar' : ''}`}>
                    <main className="admin-main-content">
                        <Outlet/>
                    </main>
                </div>
            </div>

            <GlobalAlerts/>
        </div>
    );
};

export default AdminLayout;