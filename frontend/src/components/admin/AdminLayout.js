// frontend/src/components/admin/AdminLayout.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Navbar,
    Nav,
    Dropdown,
    Offcanvas,
    Button,
    Badge
} from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

    // Отслеживание размера экрана
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);
            if (!mobile) {
                setShowMobileMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navigationItems = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: 'speedometer2',
            path: '/admin/dashboard',
            badge: null
        },
        {
            key: 'schedules',
            label: 'Schedules',
            icon: 'calendar-week',
            path: '/admin/schedules',
            badge: 'New'
        },
        {
            key: 'algorithms',
            label: 'Algorithms',
            icon: 'cpu-fill',
            path: '/admin/algorithms',
            badge: null
        },
        {
            key: 'employees',
            label: 'Employees',
            icon: 'people-fill',
            path: '/admin/employees',
            badge: null
        },
        {
            key: 'settings',
            label: 'Settings',
            icon: 'gear-fill',
            path: '/admin/settings',
            badge: null
        },
        {
            key: 'reports',
            label: 'Analytics',
            icon: 'graph-up-arrow',
            path: '/admin/reports',
            badge: null
        }
    ];

    const currentRoute = location.pathname;
    const activeItem = navigationItems.find(item => currentRoute.startsWith(item.path));

    const handleNavigation = (path) => {
        navigate(path);
        setShowMobileMenu(false);
    };

    const SidebarContent = () => (
        <Nav className="flex-column admin-nav">
            {navigationItems.map(item => (
                <Nav.Item key={item.key} className="admin-nav-item">
                    <Nav.Link
                        className={`admin-nav-link ${currentRoute.startsWith(item.path) ? 'active' : ''}`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        <div className="nav-link-content">
                            <div className="nav-icon-text">
                                <i className={`bi bi-${item.icon} nav-icon`}></i>
                                <span className="nav-text">{item.label}</span>
                            </div>
                            {item.badge && (
                                <Badge bg="primary" className="nav-badge">
                                    {item.badge}
                                </Badge>
                            )}
                        </div>
                    </Nav.Link>
                </Nav.Item>
            ))}
        </Nav>
    );

    return (
        <div className="admin-layout">
            {/* Top Navigation Bar */}
            <Navbar bg="white" className="admin-navbar shadow-sm sticky-top">
                <Container fluid className="px-3">
                    <div className="d-flex align-items-center">
                        {/* Mobile Menu Toggle */}
                        {isMobile && (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-3 mobile-menu-btn"
                                onClick={() => setShowMobileMenu(true)}
                            >
                                <i className="bi bi-list"></i>
                            </Button>
                        )}

                        {/* Brand */}
                        <Navbar.Brand className="brand-logo mb-0">
                            <i className="bi bi-calendar-check-fill text-primary me-2"></i>
                            <span className="brand-text">Shifts</span>
                            <Badge bg="secondary" className="ms-2 brand-badge">Admin</Badge>
                        </Navbar.Brand>
                    </div>

                    {/* Right side - User menu */}
                    <div className="d-flex align-items-center">
                        <Dropdown align="end">
                            <Dropdown.Toggle
                                variant="light"
                                className="user-dropdown-btn border-0 shadow-sm"
                                id="user-dropdown"
                            >
                                <div className="d-flex align-items-center">
                                    <div className="user-avatar me-2">
                                        <i className="bi bi-person-circle"></i>
                                    </div>
                                    <span className="d-none d-md-inline">Admin</span>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="user-dropdown-menu shadow">
                                <Dropdown.Header>
                                    <div className="text-muted small">Signed in as</div>
                                    <div className="fw-semibold">Administrator</div>
                                </Dropdown.Header>
                                <Dropdown.Divider />
                                <Dropdown.Item>
                                    <i className="bi bi-person me-2"></i>
                                    Profile
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <i className="bi bi-gear me-2"></i>
                                    Preferences
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    Sign out
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Container>
            </Navbar>

            {/* Main Container */}
            <Container fluid className="admin-main-container px-0">
                <div className="row g-0">
                    {/* Desktop Sidebar */}
                    {!isMobile && (
                        <div className="col-auto admin-sidebar-desktop">
                            <div className="sidebar-content">
                                <div className="sidebar-header">
                                    <h6 className="sidebar-title text-muted text-uppercase small fw-bold px-3 mb-3">
                                        Navigation
                                    </h6>
                                </div>
                                <SidebarContent />
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="col admin-content-area">
                        <main className="admin-main-content">
                            {children}
                        </main>
                    </div>
                </div>
            </Container>

            {/* Mobile Sidebar (Offcanvas) */}
            <Offcanvas
                show={showMobileMenu}
                onHide={() => setShowMobileMenu(false)}
                placement="start"
                className="admin-mobile-sidebar"
            >
                <Offcanvas.Header closeButton className="border-bottom">
                    <Offcanvas.Title>
                        <i className="bi bi-calendar-check-fill text-primary me-2"></i>
                        Shifts Admin
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <div className="mobile-sidebar-content">
                        <div className="sidebar-header">
                            <h6 className="sidebar-title text-muted text-uppercase small fw-bold px-3 mb-3 mt-3">
                                Navigation
                            </h6>
                        </div>
                        <SidebarContent />
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
};

export default AdminLayout;