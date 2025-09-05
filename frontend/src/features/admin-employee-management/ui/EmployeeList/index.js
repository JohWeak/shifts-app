// frontend/src/features/admin-employee-management/ui/EmployeeList/index.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Form, Pagination, Spinner, Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { getStatusBadgeVariant } from 'shared/lib/utils/scheduleUtils';
import { useSortableData } from 'shared/hooks/useSortableData';
import SortableHeader from 'shared/ui/components/SortableHeader';
import { AnimatePresence, motion } from 'motion/react';
import './EmployeeList.css';

const EmployeeList = ({
                          employees,
                          loading,
                          onEdit,
                          onEditModal,
                          onDelete,
                          onRestore,
                          pagination,
                          onPageChange,
                          onPageSizeChange,
                      }) => {
    const { t } = useI18n();
    const isInitialMount = useRef(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTimeout = 5000;
    const previousEmployees = useRef(employees);

    useEffect(() => {
        if (isInitialMount.current && !loading) {
            isInitialMount.current = false;
        }
    }, [loading]);

    useEffect(() => {
        if (employees && employees.length > 0) {
            previousEmployees.current = employees;
        }
    }, [employees]);

    const dataToRender = (employees && employees.length > 0) ? employees : previousEmployees.current;


    const sortingAccessors = useMemo(() => ({
        name: (employee) => {
            // Composite sorting: 1) Admin first, 2) Then by name
            const roleOrder = employee.role === 'admin' ? '0' : '1';
            const name = `${employee.first_name} ${employee.last_name}`;
            return `${roleOrder}-${name}`;
        },
        workSite: (employee) => employee.work_site_name || employee.workSite?.site_name || t('employee.commonWorkSite'),
        position: (employee) => employee.position_name || employee.defaultPosition?.pos_name || '-',
        role: (employee) => employee.role,
        status: (employee) => employee.status,
    }), [t]);

    const tableHeaders = useMemo(() => [
        { key: 'name', label: t('employee.fullName') },
        { key: 'workSite', label: t('workSite.workSite') },
        { key: 'position', label: t('employee.position') },
        { key: 'role', label: t('employee.role') },
        { key: 'status', label: t('employee.status') },
        { label: t('common.actions'), isSortable: false, thProps: { className: 'text-center' } },
    ], [t]);


    const { sortedItems: sortedEmployees, requestSort, sortConfig } = useSortableData(
        dataToRender,
        { field: 'name', order: 'ASC' },
        sortingAccessors,
    );


    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const showPagination = totalPages > 1;

    // Animation variants
    const tableBodyVariants = {
        hidden: {
            opacity: 0,
            transition: { duration: 0.15 },
        },
        visible: {
            opacity: 1,
            transition: { duration: 0.15, staggerChildren: 0.04 },
        },
    };

    const rowVariants = {
        hidden: {
            opacity: 0,
            y: 40,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: { ease: 'easeOut', duration: 0.15 },
        },
    };

    const handlePageChange = (page) => {
        setIsAnimating(true);
        onPageChange(page);
        setTimeout(() => setIsAnimating(false), animationTimeout);
    };

    const handlePageSizeChange = (size) => {
        setIsAnimating(true);
        onPageSizeChange(size);
        setTimeout(() => setIsAnimating(false), animationTimeout);
    };

    const renderPaginationControls = () => {
        return (
            <div className="pagination-container">
                <div className="page-size-selector">
                    <Form.Label className="me-2 mb-0">{t('common.show')}:</Form.Label>
                    <Form.Select
                        size="sm"
                        value={pagination.pageSize}
                        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                        className="page-size-select"
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </Form.Select>
                </div>

                {showPagination && (
                    <Pagination size="sm" className="mb-0">
                        <Pagination.First
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.page === 1}
                        />
                        <Pagination.Prev
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        />

                        {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= pagination.page - 1 && page <= pagination.page + 1)
                            ) {
                                return (
                                    <Pagination.Item
                                        key={page}
                                        active={page === pagination.page}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Pagination.Item>
                                );
                            }
                            if (page === pagination.page - 2 || page === pagination.page + 2) {
                                return <Pagination.Ellipsis key={page} disabled />;
                            }
                            return null;
                        })}

                        <Pagination.Next
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === totalPages}
                        />
                        <Pagination.Last
                            onClick={() => handlePageChange(totalPages)}
                            disabled={pagination.page === totalPages}
                        />
                    </Pagination>
                )}

                <div className="pagination-info">
                    {t('common.showing')} {Math.min(((pagination.page - 1) * pagination.pageSize) + 1, pagination.total)} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('common.of')} {pagination.total}
                </div>
            </div>
        );
    };

    if (loading && isInitialMount.current) {
        return (
            <Card className="list-card shadow-sm">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">{t('common.loading')}</span>
                    </Spinner>
                </Card.Body>
            </Card>
        );
    }

    if (!employees || employees.length === 0) {
        return (
            <Card className="list-card shadow-sm">
                <Card.Body className="text-center py-5">
                    <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                    <p className="text-muted mb-0">{t('employee.noEmployees')}</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="list-card shadow-sm">
            <Card.Header className="list-header">
                {renderPaginationControls()}
            </Card.Header>

            <Card.Body className="p-0 position-relative">
                <AnimatePresence>
                    {loading && !isInitialMount.current && (
                        <motion.div
                            className="loading-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Spinner animation="border" variant="primary" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className="table-responsive"
                    style={{ overflowY: isAnimating ? 'hidden' : 'auto' }}
                >
                    <Table hover className="data-table mb-0">
                        <thead>
                        <tr>
                            {tableHeaders.map(header => (
                                <SortableHeader
                                    key={header.key || header.label}
                                    sortKey={header.key}
                                    onSort={header.isSortable === false ? null : requestSort}
                                    sortConfig={sortConfig}
                                    {...header.thProps}
                                >
                                    {header.label}
                                </SortableHeader>
                            ))}
                        </tr>
                        </thead>
                        <AnimatePresence mode="wait">
                            <motion.tbody
                                key={pagination.page}
                                variants={tableBodyVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                            >
                                {sortedEmployees.map((employee) => (
                                    <motion.tr
                                        key={employee.emp_id}
                                        className={`${employee.status === 'inactive' ? 'inactive-row opacity-75' : ''} clickable-row`}
                                        variants={rowVariants}
                                        onClick={() => onEdit(employee)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div
                                                    className="employee-avatar me-3"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (employee.phone && window.confirm(t('employee.confirmCall', {
                                                            name: `${employee.first_name} ${employee.last_name}`,
                                                            phone: employee.phone,
                                                        }))) {
                                                            window.location.href = `tel:${employee.phone}`;
                                                        } else if (!employee.phone) {
                                                            alert(t('employee.noPhoneNumber'));
                                                        }
                                                    }}
                                                    title={employee.phone ? t('employee.clickToCall') : t('employee.noPhoneNumber')}
                                                >
                                                    {employee.first_name[0]}{employee.last_name[0]}
                                                </div>
                                                <div>
                                                    <div className="fw-semibold">
                                                        {employee.first_name} {employee.last_name}
                                                    </div>
                                                    {employee.phone && (
                                                        <small className="text-muted d-flex align-items-center">
                                                            <i className="bi bi-telephone me-1"></i>
                                                            {employee.phone}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {employee.work_site_name || employee.workSite?.site_name || t('employee.commonWorkSite')}
                                        </td>
                                        <td>
                                            {employee.position_name || employee.defaultPosition?.pos_name || '-'}
                                        </td>
                                        <td>
                                            <Badge
                                                bg={employee.role === 'admin' ? 'danger' : 'primary'}
                                                className="d-flex justify-content-center w-50 text-truncate"
                                                title={t(`role.${employee.role}`)}
                                            >
                                                <span className="text-truncate">{t(`role.${employee.role}`)}</span>
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge
                                                bg={getStatusBadgeVariant(employee.status)}
                                                className="d-flex justify-content-center w-50 text-truncate"
                                                title={t(`status.${employee.status}`)}
                                            >
                                                <span className="text-truncate">{t(`status.${employee.status}`)}</span>
                                            </Badge>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()} className="text-center">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-primary me-2"
                                                onClick={() => onEditModal ? onEditModal(employee) : onEdit(employee)}
                                                title={t('common.edit')}
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-danger me-2"
                                                onClick={() => employee.status === 'active' ? onDelete(employee) : onRestore(employee)}
                                                title={employee.status === 'active' ? t('employee.deactivate') : t('employee.restore')}
                                            >
                                                <i className={`bi bi-${employee.status === 'active' ? 'trash' : 'arrow-clockwise'}`}></i>
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </AnimatePresence>
                    </Table>
                </div>
            </Card.Body>

            <Card.Footer className="list-footer">
                {renderPaginationControls()}
            </Card.Footer>
        </Card>
    );
};

export default EmployeeList;