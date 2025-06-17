// frontend/src/pages/EmployeeDashboardPage.js
import React from 'react';
import EmployeeLayout from '../../widgets/EmployeeLayout/EmployeeLayout';
import { EmployeeDashboard } from '../../features/employee-dashboard/EmployeeDashboard';

const EmployeeDashboardPage = () => {
    return (
        <EmployeeLayout>
            <EmployeeDashboard />
        </EmployeeLayout>
    );
};

export default EmployeeDashboardPage;