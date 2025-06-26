// frontend/src/features/admin-employee-management/index.js
import React, {useCallback, useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import store from "app/store/store";
import {fetchSystemSettings} from "../admin-system-settings/model/settingsSlice";
import {fetchWorkSites} from "../admin-schedule-management/model/scheduleSlice";
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
    setPagination,
    setFilters
} from './model/employeeSlice';
import './index.css';


const EmployeeManagement = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const location = useLocation();


    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [employeeToRestore, setEmployeeToRestore] = useState(null);


    const employeesState = useSelector((state) => state.employees);
    const [sortConfig, setSortConfig] = useState({ field: 'createdAt', order: 'DESC' });

    // Для infinite scroll
    const [allEmployees, setAllEmployees] = useState([]);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const {
        employees = [],
        loading = false,
        error = null,
        filters = { status: 'active', position: 'all', search: '', work_site: 'all' },
        pagination = { page: 1, pageSize: 10, total: 0 }
    } = employeesState || {};

    // Обработка фильтров из навигации
    useEffect(() => {
        if (location.state?.filters) {
            dispatch(setFilters(location.state.filters));
            // Очищаем state после применения фильтров
            window.history.replaceState({}, document.title);
        }
    }, [location.state, dispatch]);


    // Загрузка настроек
    useEffect(() => {
        const { systemSettings } = store.getState().settings;
        const { workSites } = store.getState().schedule;

        if (!systemSettings?.positions?.length) {
            dispatch(fetchSystemSettings());
        }
        if (!workSites?.length) {
            dispatch(fetchWorkSites());
        }
    }, [dispatch]);

    // Основная загрузка сотрудников
    useEffect(() => {
        dispatch(fetchEmployees({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
            sortBy: sortConfig.field,
            sortOrder: sortConfig.order
        }));
    }, [dispatch, filters, pagination.page, pagination.pageSize, sortConfig]);


    // Обновление allEmployees при загрузке первой страницы
    useEffect(() => {
        if (employees.length > 0 && pagination.page === 1) {
            setAllEmployees(employees);
        }
    }, [employees, pagination.page]);

    // Сброс infinite scroll при изменении фильтров
    useEffect(() => {
        setAllEmployees([]);
        setHasNextPage(true);
    }, [filters]);

    // Функция для загрузки дополнительных данных
    const loadMoreEmployees = useCallback(async () => {
        if (isLoadingMore || !hasNextPage) return;

        setIsLoadingMore(true);
        const nextPage = Math.floor(allEmployees.length / pagination.pageSize) + 1;

        try {
            const response = await dispatch(fetchEmployees({
                ...filters,
                page: nextPage,
                pageSize: pagination.pageSize,
                sortBy: sortConfig.field,
                sortOrder: sortConfig.order
            })).unwrap();

            if (response.data.length > 0) {
                setAllEmployees(prev => [...prev, ...response.data]);
                setHasNextPage(response.data.length === pagination.pageSize);
            } else {
                setHasNextPage(false);
            }
        } catch (error) {
            console.error('Error loading more employees:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [dispatch, filters, pagination.pageSize, sortConfig, allEmployees.length, isLoadingMore, hasNextPage]);


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
            const updatedData = {
                ...employeeToDelete,
                status: 'inactive'
            };

            const result = await dispatch(updateEmployee({
                employeeId: employeeToDelete.emp_id,
                data: updatedData
            }));

            // Если обновление успешно, перезагружаем список
            if (updateEmployee.fulfilled.match(result)) {
                dispatch(fetchEmployees({
                    ...filters,
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                    sortBy: sortConfig.field,
                    sortOrder: sortConfig.order
                }));
            }

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

            const result = await dispatch(updateEmployee({
                employeeId: employeeToRestore.emp_id,
                data: updatedData
            }));

            // Если обновление успешно, перезагружаем список
            if (updateEmployee.fulfilled.match(result)) {
                dispatch(fetchEmployees({
                    ...filters,
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                    sortBy: sortConfig.field,
                    sortOrder: sortConfig.order
                }));
            }

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