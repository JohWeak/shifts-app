// frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.js
import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Navbar, Nav, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {LanguageSwitch} from 'shared/ui/components/LanguageSwitch/LanguageSwitch';
import ThemeToggle from 'shared/ui/components/ThemeToggle/ThemeToggle';
import GlobalAlerts from 'shared/ui/components/GlobalAlerts/GlobalAlerts';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
    const { isAuthenticated, loading, user } = useSelector(state => state.auth);
    const { t } = useI18n();
    const location = useLocation();
    const navigate = useNavigate();

    if (loading === 'pending') {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const navItems = [
        { path: '/employee/schedule', icon: 'calendar-week', label: t('employee.schedule.title') },
        { path: '/employee/constraints', icon: 'shield-check', label: t('employee.constraints') },
        { path: '/employee/requests', icon: 'envelope', label: t('employee.requests.title') },
    ];

    const handleLogout = () => {
        // Dispatch logout action
        navigate('/login');
    };

    return (
        <>
            <Navbar bg="primary" variant="dark" expand="lg" className="employee-navbar">
                <Container fluid>
                    <Navbar.Brand className="d-flex align-items-center">
                        <i className="bi bi-calendar-check me-2"></i>
                        {t('common.appName')}
                    </Navbar.Brand>

                    <div className="ms-auto d-flex align-items-center gap-3">
                        <span className="navbar-text text-white">
                            {user?.first_name} {user?.last_name}
                        </span>
                        <LanguageSwitch />
                        <ThemeToggle variant="icon" />
                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={handleLogout}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </Container>
            </Navbar>

            <Nav className="employee-nav-tabs">
                <Container fluid>
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

            <main className="employee-main-content">
                <GlobalAlerts />
                <Outlet />
            </main>
        </>
    );
};

export default EmployeeLayout;