// frontend/src/features/admin-employee-management/index.js
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useLocation, useNavigate} from 'react-router-dom';
import store from 'app/store/store';
import {fetchSystemSettings} from '../admin-system-settings/model/settingsSlice';
import {fetchWorkSites} from '../admin-schedule-management/model/scheduleSlice';
import {Button, Col, Container, Row} from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import EmployeeList from './ui/EmployeeList';
import EmployeeModal from './ui/EmployeeModal';
import EmployeeFilters from './ui/EmployeeFilters';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {addNotification} from 'app/model/notificationsSlice';
import {createEmployee, fetchEmployees, setFilters, setPagination, updateEmployee,} from './model/employeeSlice';
import './index.css';

const EmployeeManagement = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [employeeToRestore, setEmployeeToRestore] = useState(null);


    const employeesState = useSelector((state) => state.employees);
    const [sortConfig, setSortConfig] = useState({field: 'role', order: 'ASC'});


    const {
        employees = [],
        loading = false,
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
        try {
            let result;
            if (selectedEmployee) {
                result = await dispatch(updateEmployee({
                    employeeId: selectedEmployee.emp_id,
                    data: employeeData,
                }));

                if (updateEmployee.fulfilled.match(result)) {
                    dispatch(addNotification({
                        message: t('employee.updateSuccess', 'Employee updated successfully'),
                        variant: 'success',
                    }));
                    setShowModal(false);
                } else {
                    dispatch(addNotification({
                        message: result.payload || t('employee.updateError', 'Failed to update employee'),
                        variant: 'danger',
                    }));
                }
            } else {
                result = await dispatch(createEmployee(employeeData));

                if (createEmployee.fulfilled.match(result)) {
                    dispatch(addNotification({
                        message: t('employee.createSuccess', 'Employee created successfully'),
                        variant: 'success',
                    }));
                    setShowModal(false);
                } else {
                    dispatch(addNotification({
                        message: result.payload || t('employee.createError', 'Failed to create employee'),
                        variant: 'danger',
                    }));
                }
            }
        } catch (error) {
            dispatch(addNotification({
                message: error.message || t('errors.generic', 'An error occurred'),
                variant: 'danger',
            }));
        }
    };

    const handlePageChange = (page) => {
        dispatch(setPagination({page}));
    };

    const handlePageSizeChange = (pageSize) => {
        dispatch(setPagination({pageSize, page: 1}));
    };

    const breadcrumbs = useMemo(() => {
        const origin = location.state?.breadcrumbOrigin;
        if (!origin) {
            return null;
        }
        return [
            {
                text: t('workplace.title'),
                onClick: () => {
                    navigate(origin.pathname);
                }
            },
            {
                text: origin.label,
                onClick: () => {
                    navigate(origin.pathname, {
                        state: {initialTab: origin.tab}
                    });
                }
            },
            {text: t('employee.management')}
        ];

    }, [location.state, t, navigate]);

    return (
        <div className="employee-management">
            <PageHeader
                title={t('settings.employeeSettings')}
                subtitle={t('settings.employeeSettingsSubtitle')}
                breadcrumbs={breadcrumbs}
                actions={
                    <div>
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