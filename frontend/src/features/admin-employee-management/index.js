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
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [employeeToRestore, setEmployeeToRestore] = useState(null);


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
            // Сохраняем все данные работника и меняем только статус
            const updatedData = {
                ...employeeToDelete,
                status: 'inactive'
            };

            await dispatch(updateEmployee({
                employeeId: employeeToDelete.emp_id,
                data: updatedData
            }));
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
        }
    };

    const handleRestoreClick = (employee) => {
        setEmployeeToRestore(employee);
        setShowRestoreConfirm(true);
    };

    const handleRestoreEmployee = async () => {
        if (employeeToRestore) {
            const updatedData = {
                ...employeeToRestore,
                status: 'active'
            };

            await dispatch(updateEmployee({
                employeeId: employeeToRestore.emp_id,
                data: updatedData
            }));
            setShowRestoreConfirm(false);
            setEmployeeToRestore(null);
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
                        { text: t('navigation.dashboard'), to: '/admin' },
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

                <Container fluid className="px-2 mt-3">
                    <Row className="g-3">
                        <Col xs={12}>
                            <EmployeeFilters />
                        </Col>
                        <Col xs={12}>
                            <EmployeeList
                                employees={employees}
                                loading={loading}
                                onEdit={handleEditEmployee}
                                onDelete={handleDeleteClick}
                                onRestore={handleRestoreClick}
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
                <ConfirmationModal
                    show={showRestoreConfirm}
                    onHide={() => setShowRestoreConfirm(false)}
                    onConfirm={handleRestoreEmployee}
                    title={t('employee.restoreConfirmTitle')}
                    message={t('employee.restoreConfirmMessage', {
                        name: employeeToRestore ?
                            `${employeeToRestore.first_name} ${employeeToRestore.last_name}` : ''
                    })}
                    confirmVariant="success"
                    confirmText={t('employee.restore')}
                />
            </div>
        </AdminLayout>
    );
};

export default EmployeeManagement;