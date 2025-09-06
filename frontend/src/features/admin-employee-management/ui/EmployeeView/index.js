// frontend/src/features/admin-employee-management/ui/EmployeeView/index.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, Container, Nav } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader';
import { useClearDataOnEmployeeChange } from '../../hooks/useClearDataOnEmployeeChange';

// Import employee features without their PageHeaders
import EmployeeSchedule from 'features/employee-schedule';
import EmployeeConstraints from 'features/employee-constraints';
import EmployeeRequests from 'features/employee-requests';
import EmployeeArchive from 'features/employee-archive';

import './EmployeeView.css';

const EmployeeView = ({ employee: propEmployee }) => {
    const { t } = useI18n();
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('schedule');

    // Employee data could come from props, location state, or we might need to fetch it
    const [employee] = useState(propEmployee || location.state?.employee);

    // Clear cached data when switching between employees
    useClearDataOnEmployeeChange(employeeId);

    useEffect(() => {
        // If we don't have employee data and have an employeeId, we might need to fetch it
        // For now, we'll assume it's passed via navigation state or props
        if (!employee && employeeId) {
            // TODO: Fetch employee data by ID if needed
        }
    }, [employee, employeeId]);

    const handleBackToList = () => {
        navigate('/admin/employees');
    };

    if (!employee) {
        return (
            <Container className="mt-4">
                <div className="text-center">
                    <p>{t('common.loading')}</p>
                </div>
            </Container>
        );
    }

    const employeeName = `${employee.first_name} ${employee.last_name}`;

    const breadcrumbs = [
        { label: t('navigation.admin'), path: '/admin' },
        { label: t('navigation.employees'), path: '/admin/employees', onClick: handleBackToList },
        { label: employeeName },
    ];

    const tabConfig = [
        {
            key: 'schedule',
            label: t('navigation.schedule'),
            icon: 'calendar-week',
            component: EmployeeSchedule,
        },
        {
            key: 'constraints',
            label: t('navigation.constraints'),
            icon: 'shield-fill-check',
            component: EmployeeConstraints,
        },
        {
            key: 'requests',
            label: t('navigation.requests'),
            icon: 'envelope-paper',
            component: EmployeeRequests,
        },
        {
            key: 'archive',
            label: t('navigation.archive'),
            icon: 'archive',
            component: EmployeeArchive,
        },
    ];

    const ActiveComponent = tabConfig.find(tab => tab.key === activeTab)?.component;

    return (
        <Container fluid className="employee-view-container">
            <PageHeader
                icon="person-gear"
                title={`${employeeName} Management`}
                subtitle={t('employee.manageAccountPermissions', { name: employeeName })}
                breadcrumbs={breadcrumbs}
            />

            <Card className="mb-3">
                <Card.Header className="bg-transparent border-bottom-0">
                    <Nav variant="tabs" className="card-header-tabs">
                        {tabConfig.map((tab) => (
                            <Nav.Item key={tab.key}>
                                <Nav.Link
                                    active={activeTab === tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="d-flex align-items-center"
                                >
                                    <i className={`bi bi-${tab.icon} me-2`}></i>
                                    {tab.label}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                </Card.Header>
            </Card>

            <div className="employee-content">
                {ActiveComponent && <ActiveComponent employeeId={employee.emp_id} hidePageHeader={true} />}
            </div>
        </Container>
    );
};

export default EmployeeView;