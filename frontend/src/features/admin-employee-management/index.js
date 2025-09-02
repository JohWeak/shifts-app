// frontend/src/features/admin-employee-management/index.js
import React, {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation} from 'react-router-dom';
import store from 'app/store/store';
import {fetchSystemSettings} from '../admin-system-settings/model/settingsSlice';
import {fetchWorkSites} from '../admin-schedule-management/model/scheduleSlice';
import {Alert, Button, Col, Container, Row} from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import EmployeeList from './ui/EmployeeList';
import EmployeeModal from './ui/EmployeeModal';
import EmployeeFilters from './ui/EmployeeFilters';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {
    clearCache,
    clearError,
    createEmployee,
    fetchEmployees,
    setFilters,
    setPagination,
    updateEmployee,
} from './model/employeeSlice';
import './index.css';

const EmployeeManagement = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const location = useLocation();


    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [employeeToRestore, setEmployeeToRestore] = useState(null);


    const employeesState = useSelector((state) => state.employees);
    const [sortConfig, setSortConfig] = useState({field: 'createdAt', order: 'DESC'});


    const {
        employees = [],
        loading = false,
        error = null,
        filters = {status: 'active', position: 'all', search: '', work_site: 'all'},
        pagination = {page: 1, pageSize: 20, total: 0},
    } = employeesState || {};

    const isInitialMount = useRef(true);

    // Navigation filter processing
    useEffect(() => {
        if (location.state?.filters) {
            dispatch(setFilters(location.state.filters));

            window.history.replaceState({}, document.title);
        }
    }, [location.state, dispatch]);


    // Settings
    useEffect(() => {
        const {systemSettings} = store.getState().settings;
        const {workSites} = store.getState().schedule;

        if (!systemSettings?.positions?.length) {
            dispatch(fetchSystemSettings());
        }
        if (!workSites?.length) {
            dispatch(fetchWorkSites());
        }
    }, [dispatch]);


    // Main employee loading
    useEffect(() => {
        // Creating a timeout for debouncing filter changes
        const fetchData = () => {
            dispatch(fetchEmployees({
                ...filters,
                page: pagination.page,
                pageSize: pagination.pageSize,
                sortBy: sortConfig.field,
                sortOrder: sortConfig.order,

            }));
        };

        if (isInitialMount.current) {
            fetchData();
            isInitialMount.current = false;
        } else {
            const timeoutId = setTimeout(fetchData, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [
        dispatch,
        filters,
        pagination,
        sortConfig.field,
        sortConfig.order,
    ]);


    const handleSort = (field, order) => {
        setSortConfig({field, order});
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
                status: 'inactive',
            };

            const result = await dispatch(updateEmployee({
                employeeId: employeeToDelete.emp_id,
                data: updatedData,
            }));


            if (updateEmployee.fulfilled.match(result)) {
                dispatch(fetchEmployees({
                    ...filters,
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                    sortBy: sortConfig.field,
                    sortOrder: sortConfig.order,
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
                status: 'active',
            };

            const result = await dispatch(updateEmployee({
                employeeId: employeeToRestore.emp_id,
                data: updatedData,
            }));

            if (updateEmployee.fulfilled.match(result)) {
                dispatch(fetchEmployees({
                    ...filters,
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                    sortBy: sortConfig.field,
                    sortOrder: sortConfig.order,
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
                data: employeeData,
            }));
        } else {
            await dispatch(createEmployee(employeeData));
        }
        setShowModal(false);
    };

    const handlePageChange = (page) => {
        dispatch(setPagination({page}));
    };

    const handlePageSizeChange = (pageSize) => {
        dispatch(setPagination({pageSize, page: 1}));
    };

    return (
        <div className="employee-management">
            <PageHeader
                title={t('employee.management')}
                description={t('employee.managementDescription')}
                breadcrumbs={[
                    {text: t('navigation.dashboard'), to: '/admin'},
                    {text: t('employee.management')},
                ]}
                actions={
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                dispatch(clearCache());
                                dispatch(fetchEmployees({
                                    ...filters,
                                    page: pagination.page,
                                    pageSize: pagination.pageSize,
                                    sortBy: sortConfig.field,
                                    sortOrder: sortConfig.order,
                                }));
                            }}
                            disabled={loading}
                            title={t('common.refresh')}
                        >
                            <i className="bi bi-arrow-clockwise"></i>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateEmployee}
                            className="create-button"
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            {t('employee.addNew')}
                        </Button>
                    </div>
                }
            />

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => dispatch(clearError())}
                >
                    {error}
                </Alert>
            )}

            <Container fluid className="p-0 mt-3">
                <Row className="">
                    <Col xs={12}>
                        <EmployeeFilters/>
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
                        `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : '',
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
                        `${employeeToRestore.first_name} ${employeeToRestore.last_name}` : '',
                })}
                confirmVariant="success"
                confirmText={t('employee.restore')}
            />
        </div>
    );
};

export default EmployeeManagement;