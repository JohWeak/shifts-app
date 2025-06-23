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

    const employeesState = useSelector((state) => state.employees);
    const [sortConfig, setSortConfig] = useState({ field: 'createdAt', order: 'DESC' });

    const {
        employees = [],
        loading = false,
        error = null,
        filters = { status: 'active', position: 'all', search: '', work_site: 'all' },
        pagination = { page: 1, pageSize: 10, total: 0 }
    } = employeesState || {};

    useEffect(() => {
        dispatch(fetchEmployees({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
            sortBy: sortConfig.field,
            sortOrder: sortConfig.order
        }));
    }, [dispatch, filters, pagination.page, pagination.pageSize, sortConfig]);

// Добавить функцию handleSort:
    const handleSort = (field, order) => {
        setSortConfig({ field, order });
    };

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
            // Instead of deleting, we set status to inactive
            await dispatch(updateEmployee({
                employeeId: employeeToDelete.emp_id,
                data: { status: 'inactive' }
            }));
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
        }
    };

    const handleRestoreEmployee = async (employee) => {
        await dispatch(updateEmployee({
            employeeId: employee.emp_id,
            data: { status: 'active' }
        }));
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

    const handlePageSizeChange = (pageSize) => {
        dispatch(setPagination({ pageSize, page: 1 }));
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
                            className="create-button"
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

                <Container fluid className="px-2">
                    <Row className="g-4 mt-2">
                        <Col lg={3} className="mt-2" >
                            <EmployeeFilters />
                        </Col>
                        <Col lg={9}>
                            <EmployeeList
                                employees={employees}
                                loading={loading}
                                onEdit={handleEditEmployee}
                                onDelete={handleDeleteClick}
                                onRestore={handleRestoreEmployee}
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                onSort={handleSort}
                                currentSort={sortConfig}
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
                    message={t('employee.deactivateConfirmMessage', {
                        name: employeeToDelete ?
                            `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : ''
                    })}
                    confirmVariant="warning"
                    confirmText={t('employee.deactivate')}
                />
            </div>
        </AdminLayout>
    );
};

export default EmployeeManagement;