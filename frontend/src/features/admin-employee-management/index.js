// frontend/src/features/admin-employee-management/index.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import AdminLayout from 'shared/ui/layouts/AdminLayout/AdminLayout';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import EmployeeList from './ui/EmployeeList/EmployeeList';
import EmployeeModal from './ui/EmployeeModal/EmployeeModal';
import EmployeeFilters from './ui/EmployeeFilters/EmployeeFilters';
import ConfirmationModal from "shared/ui/components/ConfirmationModal/ConfirmationModal";
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
    setPagination
} from './model/employeeSlice';
import './index.css';

const EmployeeManagement = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    // Get the entire employees state for debugging
    const employeesState = useSelector((state) => state.employees);

    // Log the state to see what's happening
    console.log('Employees State:', employeesState);

    const {
        employees = [],
        loading = false,
        error = null,
        filters = { status: 'active', position: 'all', search: '' },
        pagination = { page: 1, pageSize: 10, total: 0 }
    } = employeesState || {};

    console.log('Employees array:', employees);
    console.log('Loading:', loading);

    useEffect(() => {
        console.log('Dispatching fetchEmployees with filters:', filters);
        dispatch(fetchEmployees(filters));
    }, [dispatch, filters]);

    const handleCreateEmployee = () => {
        setSelectedEmployee(null);
        setShowModal(true);
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowModal(true);
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setShowDeleteConfirm(true);
    };

    const handleDeleteEmployee = async () => {
        if (employeeToDelete) {
            await dispatch(deleteEmployee(employeeToDelete.emp_id));
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
        }
    };

    const handleSaveEmployee = async (employeeData) => {
        if (selectedEmployee) {
            await dispatch(updateEmployee({
                employeeId: selectedEmployee.emp_id,
                data: employeeData
            }));
        } else {
            await dispatch(createEmployee(employeeData));
        }
        setShowModal(false);
    };

    const handlePageChange = (page) => {
        dispatch(setPagination({ page }));
    };

    return (
        <AdminLayout>
            <div className="employee-management">
                <PageHeader
                    title={t('employee.management')}
                    description={t('employee.managementDescription')}
                    breadcrumbs={[
                        { text: t('admin.dashboard'), to: '/admin' },
                        { text: t('employee.management') }
                    ]}
                    actions={
                        <Button
                            variant="primary"
                            onClick={handleCreateEmployee}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            {t('employee.addNew')}
                        </Button>
                    }
                />

                {error && (
                    <Container className="mt-3">
                        <Alert
                            variant="danger"
                            dismissible
                            onClose={() => dispatch(clearError())}
                        >
                            {error}
                        </Alert>
                    </Container>
                )}

                <Container className="mt-4">
                    <Row>
                        <Col lg={3}>
                            <EmployeeFilters />
                        </Col>
                        <Col lg={9}>
                            <EmployeeList
                                employees={employees}
                                loading={loading}
                                onEdit={handleEditEmployee}
                                onDelete={handleDeleteClick}
                                pagination={pagination}
                                onPageChange={handlePageChange}
                            />
                        </Col>
                    </Row>
                </Container>

                <EmployeeModal
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    onSave={handleSaveEmployee}
                    employee={selectedEmployee}
                />

                <ConfirmationModal
                    show={showDeleteConfirm}
                    onHide={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDeleteEmployee}
                    title={t('employee.deleteConfirmTitle')}
                    message={t('employee.deleteConfirmMessage', {
                        name: employeeToDelete ?
                            `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : ''
                    })}
                    confirmVariant="danger"
                    confirmText={t('common.delete')}
                />
            </div>
        </AdminLayout>
    );
};

export default EmployeeManagement;