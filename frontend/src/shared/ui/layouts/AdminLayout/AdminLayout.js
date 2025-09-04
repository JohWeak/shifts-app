// frontend/src/shared/ui/layouts/AdminLayout/AdminLayout.js
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { Badge, Button, Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from 'features/auth/model/authSlice';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import GlobalAlerts from 'shared/ui/components/GlobalAlerts';
import ThemeToggle from 'shared/ui/components/ThemeToggle';
import { fetchSchedules, resetScheduleView } from 'features/admin-schedule-management/model/scheduleSlice';
import { fetchAllRequests } from 'features/admin-permanent-requests/model/adminRequestsSlice';
import { AnimatePresence, motion } from 'motion/react';

import './AdminLayout.css';

const AdminLayout = () => {
    const { t, direction } = useI18n();
    const { pendingCount } = useSelector(state => state.adminRequests);
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const sidebarRef = useRef(null);
    const expandTimeoutRef = useRef(null);

    const currentOutlet = useOutlet();
    const [outlet, setOutlet] = useState(currentOutlet);
    const [prevLocation, setPrevLocation] = useState(location);
    useEffect(() => {
        if (location.pathname !== prevLocation.pathname) {
            setPrevLocation(location);
            setOutlet(currentOutlet);
        }
    }, [location, currentOutlet, prevLocation]);

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
        void preloadData();
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
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
                // eslint-disable-next-line react-hooks/exhaustive-deps
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
            badge: null,
        },
        {
            key: 'schedules',
            label: t('navigation.schedules'),
            icon: 'calendar-week',
            path: '/admin/schedules',
            badge: t('common.new'),
        },
        {
            key: 'workplace',
            label: t('navigation.workplace'),
            icon: 'building',
            path: '/admin/workplace',
            badge: null,
        },

        {
            key: 'employees',
            label: t('navigation.employees'),
            icon: 'people-fill',
            path: '/admin/employees',
            badge: null,
        },
        {
            key: 'requests',
            label: t('navigation.requests'),
            icon: 'clipboard-check',
            path: '/admin/permanent-requests',
            badge: pendingCount > 0 ? pendingCount : null,
        },
        {
            key: 'reports',
            label: t('navigation.reports'),
            icon: 'graph-up-arrow',
            path: '/admin/reports',
            badge: null,
        },
        {
            key: 'settings',
            label: t('navigation.settings'),
            icon: 'cpu-fill',
            path: '/admin/settings',
            badge: null,
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
                        <ThemeToggle variant="icon" />
                        <LanguageSwitch />

                        <Dropdown align="end" className="ms-1">
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
                                    <div className="fw-semibold">{user?.name}</div>
                                    <div className="fw-semibold text-muted small">{t('common.admin')}</div>
                                </Dropdown.Header>
                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/admin/profile">
                                    <i className="bi bi-person me-2"></i>
                                    {t('common.profile')}
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

            {/* Main Container */}
            <div className="admin-main-container">
                {/* Sidebar - Always compact, expands on click */}
                <motion.div
                    ref={sidebarRef}
                    className={`admin-sidebar-desktop ${isSidebarExpanded ? 'expanded' : 'compact'}`}
                    onMouseLeave={handleSidebarMouseLeave}
                    animate={{
                        width: isSidebarExpanded ? 'var(--app-sidebar-width)' : 'var(--app-colapsed-sidebar-width)',
                        boxShadow: isSidebarExpanded ?
                            (direction === 'rtl' ? '-4px 0 20px rgba(0, 0, 0, 0.15)' : '4px 0 20px rgba(0, 0, 0, 0.15)')
                            : 'none',
                    }}
                    style={{
                        position: 'fixed',
                        left: direction === 'rtl' ? 'auto' : 0,
                        right: direction === 'rtl' ? 0 : 'auto',
                        top: 'var(--app-navbar-height)',
                        zIndex: 1040,
                    }}
                    initial={false}
                    transition={{
                        duration: 0.3,
                        ease: [0.4, 0.0, 0.2, 1],
                        width: { duration: 0.25 },
                        boxShadow: { duration: 0.2, delay: isSidebarExpanded ? 0.1 : 0 },
                    }}
                >
                    <div className="sidebar-content">
                        <SidebarContent isCompact={true} />
                    </div>
                </motion.div>

                {/* Main Content Area */}
                <div className="admin-content-area">
                    <AnimatePresence mode="wait">
                        <motion.main
                            key={location.pathname}
                            className="admin-main-content"
                            initial={{ opacity: 0.4, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{
                                duration: 0.2,
                                ease: 'easeInOut',
                            }}
                        >
                            {outlet}
                        </motion.main>
                    </AnimatePresence>
                </div>
            </div>

            <GlobalAlerts />
        </div>
    );
};

export default AdminLayout;