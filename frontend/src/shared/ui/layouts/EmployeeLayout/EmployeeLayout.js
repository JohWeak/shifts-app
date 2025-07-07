// frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.js
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
    const { t } = useTranslation();
    const location = useLocation();
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

    return (
        <div className="employee-layout">
            <Navbar bg="primary" variant="dark" className="employee-navbar">
                <Container>
                    <Navbar.Brand>
                        {t('employee.portal')} - {user?.full_name}
                    </Navbar.Brand>
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