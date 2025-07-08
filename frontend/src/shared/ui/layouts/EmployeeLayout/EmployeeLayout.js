// frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.js
import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { logout } from 'features/auth/model/authSlice';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
    const { t } = useI18n();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const isAdminView = location.pathname.includes('/admin/my-employee-profile');

    const navItems = [
        { path: 'schedule', label: t('employee.schedule'), icon: 'bi-calendar3' },
        { path: 'constraints', label: t('employee.constraints'), icon: 'bi-clock-history' },
        { path: 'requests', label: t('employee.myRequests'), icon: 'bi-inbox' },
    ];

    const getBasePath = () => {
        return isAdminView ? '/admin/my-employee-profile' : '/employee';
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const formatUserName = () => {
        // Используем name вместо first_name/last_name
        return user?.name || user?.login || t('common.user');
    };

    return (
        <div className="employee-layout">
            <Navbar bg="primary" variant="dark" className="employee-navbar">
                <Container>
                    <Navbar.Brand>
                        {t('employee.portal')}
                    </Navbar.Brand>
                    <Nav className="ms-auto">
                        <NavDropdown
                            title={formatUserName()}
                            id="employee-nav-dropdown"
                            align="end"
                        >
                            <NavDropdown.Item disabled>
                                <i className="bi bi-gear me-2"></i>
                                {t('common.settings')}
                            </NavDropdown.Item>
                            <NavDropdown.Item disabled>
                                <i className="bi bi-person me-2"></i>
                                {t('common.profile')}
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                {t('auth.logout')}
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Container>
            </Navbar>

            <Nav variant="tabs" className="employee-nav-tabs">
                <Container>
                    <div className="d-flex">
                        {navItems.map(item => (
                            <Nav.Item key={item.path}>
                                <Nav.Link
                                    as={NavLink}
                                    to={`${getBasePath()}/${item.path}`}
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <i className={`bi ${item.icon} me-2`}></i>
                                    {item.label}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </div>
                </Container>
            </Nav>

            <Container className="employee-content py-4">
                <Outlet />
            </Container>
        </div>
    );
};

export default EmployeeLayout;