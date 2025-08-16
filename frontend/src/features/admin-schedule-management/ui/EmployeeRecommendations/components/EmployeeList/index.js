//frontend/src/features/admin-schedule-management/ui/EmployeeRecommendations/components/EmployeeList/index.js

import React from 'react';
import { ListGroup, Alert } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import EmployeeListItem from '../EmployeeListItem';
import './EmployeeList.css'

const EmployeeList = ({ employees, type, onItemClick, searchTerm }) => {
    const { t } = useI18n();

    const filterEmployees = (empList) => {
        if (!searchTerm) return empList;
        return empList.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filtered = filterEmployees(employees || []);

    if (filtered.length === 0) {
        return (
            <Alert variant="info" className="mt-3">
                <i className="bi bi-info-circle me-2"></i>
                {searchTerm ? t('employee.noMatchingEmployees') : t('employee.noEmployeesInCategory')}
            </Alert>
        );
    }

    return (
        <ListGroup>
            {filtered.map(employee => (
                <EmployeeListItem
                    key={employee.emp_id}
                    employee={employee}
                    type={type}
                    onItemClick={onItemClick}
                />
            ))}
        </ListGroup>
    );
};

export default EmployeeList;