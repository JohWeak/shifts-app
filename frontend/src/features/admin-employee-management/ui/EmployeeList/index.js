// frontend/src/features/admin-employee-management/ui/EmployeeList/index.js
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Card, Table, Button, Badge, Spinner, Pagination, Form} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {getStatusBadgeVariant} from "shared/lib/utils/scheduleUtils";
import {useSortableData} from 'shared/hooks/useSortableData';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import {motion, AnimatePresence} from "motion/react";
import './EmployeeList.css';

const EmployeeList = ({
                          employees,
                          loading,
                          onEdit,
                          onDelete,
                          onRestore,
                          pagination,
                          onPageChange,
                          onPageSizeChange,
                      }) => {
    const {t} = useI18n();
    const isInitialMount = useRef(true);
    React.useEffect(() => {
        if (isInitialMount.current && !loading) {
            isInitialMount.current = false;
        }
    }, [loading]);

    const sortingAccessors = useMemo(() => ({
        name: (employee) => `${employee.first_name} ${employee.last_name}`,
        workSite: (employee) => employee.work_site_name || employee.workSite?.site_name || t('employee.commonWorkSite'),
        position: (employee) => employee.position_name || employee.defaultPosition?.pos_name || '-',
        status: (employee) => employee.status,
    }), [t]);


    const { sortedItems: sortedEmployees, requestSort, sortConfig } = useSortableData(
        employees,
        { field: 'name', order: 'ASC' },
        sortingAccessors
    );
    const employeeDataKey = useMemo(() => {
        if (!employees || employees.length === 0) {
            return `page-${pagination.page}`;
        }
        return employees.slice(0, 5).map(e => e.emp_id).join('-');
    }, [employees, pagination.page]);

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const showPagination = totalPages > 1;

    // Animation variants
    const tableBodyVariants = {
        hidden: {
            opacity: 0,
            transition: { duration: 0.1 }
        },
        visible: {
            opacity: 1,
            transition: { duration: 0.1, staggerChildren: 0.03 }
        }
    };

    const rowVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            transition: { duration: 0.1 }
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: { ease: "easeOut", duration: 0.15 }
        },
    };



    const renderPaginationControls = () => {
        return (
            <div className="pagination-container">
                <div className="page-size-selector">
                    <Form.Label className="me-2 mb-0">{t('common.show')}:</Form.Label>
                    <Form.Select
                        size="sm"
                        value={pagination.pageSize}
                        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
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
                            onClick={() => onPageChange(1)}
                            disabled={pagination.page === 1}
                        />
                        <Pagination.Prev
                            onClick={() => onPageChange(pagination.page - 1)}
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
                                        onClick={() => onPageChange(page)}
                                    >
                                        {page}
                                    </Pagination.Item>
                                );
                            }
                            if (page === pagination.page - 2 || page === pagination.page + 2) {
                                return <Pagination.Ellipsis key={page} disabled/>;
                            }
                            return null;
                        })}

                        <Pagination.Next
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page === totalPages}
                        />
                        <Pagination.Last
                            onClick={() => onPageChange(totalPages)}
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
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.2}}
                        >
                            <Spinner animation="border" variant="primary"/>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="table-responsive">
                    <Table hover className="data-table mb-0">
                        <thead>
                        <tr>
                            <SortableHeader
                                sortKey="name"
                                sortConfig={sortConfig}
                                onSort={requestSort}
                            >
                                {t('employee.fullName')}
                            </SortableHeader>
                            <SortableHeader
                                sortKey="workSite"
                                sortConfig={sortConfig}
                                onSort={requestSort}
                            >
                                {t('workSite.workSite')}
                            </SortableHeader>
                            <SortableHeader
                                sortKey="position"
                                sortConfig={sortConfig}
                                onSort={requestSort}
                            >
                                {t('employee.position')}
                            </SortableHeader>
                            <SortableHeader
                                sortKey="status"
                                sortConfig={sortConfig}
                                onSort={requestSort}
                            >
                                {t('employee.status')}
                            </SortableHeader>
                            <th className="text-center">{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <AnimatePresence mode="wait">
                            <motion.tbody
                                key={employeeDataKey}
                                variants={tableBodyVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                            >
                                {sortedEmployees.map((employee) => (
                                    <motion.tr
                                        key={employee.emp_id}
                                        className={`${employee.status === 'inactive' ? 'inactive-row' : ''} clickable-row`}
                                        variants={rowVariants}
                                        onClick={() => onEdit(employee)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div
                                                    className="employee-avatar me-3"
                                                    style={{cursor: 'pointer'}}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (employee.phone && window.confirm(t('employee.confirmCall', {
                                                            name: `${employee.first_name} ${employee.last_name}`,
                                                            phone: employee.phone
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
                                                bg={getStatusBadgeVariant(employee.role === 'admin' ? 'admin' : employee.status)}>
                                                {employee.role === 'admin'
                                                    ? t(`role.${employee.role}`)
                                                    : t(`status.${employee.status}`)
                                                }
                                            </Badge>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()} className="text-center">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-danger"
                                                onClick={() => employee.status === 'active' ? onDelete(employee) : onRestore(employee)}
                                                title={employee.status === ('active' || 'admin') ? t('employee.deactivate') : t('employee.restore')}
                                            >
                                                <i className={`bi bi-${employee.status === ('active' || 'admin') ? 'trash' : 'arrow-clockwise'}`}></i>
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