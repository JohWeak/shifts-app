// frontend/src/features/admin-employee-management/ui/EmployeeList/EmployeeList.js
import React, { useState } from 'react';
import { Card, Table, Button, Badge, Spinner, Pagination, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import './EmployeeList.css';
import ActionButtons from "../../../../shared/ui/components/ActionButtons/ActionButtons";
import {getStatusBadgeVariant} from "../../../../shared/lib/utils/scheduleUtils";

const EmployeeList = ({
                          employees,
                          loading,
                          onEdit,
                          onDelete,
                          onRestore,
                          pagination,
                          onPageChange,
                          onPageSizeChange,
                          onSort,
                          currentSort
                      }) => {
    const { t } = useI18n();
    const [sortConfig, setSortConfig] = useState(currentSort || { field: null, order: null });

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const showPagination = totalPages > 1;

    const handleSort = (field) => {
        let newOrder = 'ASC';
        if (sortConfig.field === field && sortConfig.order === 'ASC') {
            newOrder = 'DESC';
        }
        setSortConfig({ field, order: newOrder });
        onSort(field, newOrder);
    };

    const getSortIcon = (field) => {
        if (sortConfig.field !== field) {
            return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
        }
        return sortConfig.order === 'ASC'
            ? <i className="bi bi-arrow-up ms-1"></i>
            : <i className="bi bi-arrow-down ms-1"></i>;
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
                                return <Pagination.Ellipsis key={page} disabled />;
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

    if (loading) {
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

            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table hover className="data-table mb-0">
                        <thead>
                        <tr>
                            <th
                                className="sortable-header"
                                onClick={() => handleSort('name')}
                            >
                                {t('employee.fullName')}
                                {getSortIcon('name')}
                            </th>
                            <th
                                className="sortable-header"
                                onClick={() => handleSort('workSite')}
                            >
                                {t('workSite.workSite')}
                                {getSortIcon('workSite')}
                            </th>
                            <th
                                className="sortable-header"
                                onClick={() => handleSort('position')}
                            >
                                {t('employee.position')}
                                {getSortIcon('position')}
                            </th>
                            <th
                                className="sortable-header"
                                onClick={() => handleSort('status')}
                            >
                                {t('employee.status')}
                                {getSortIcon('status')}
                            </th>
                            <th className="text-center">{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {employees.map((employee) => (
                            <tr
                                key={employee.emp_id}
                                className={`${employee.status === 'inactive' ? 'inactive-row' : ''} clickable-row`}
                                onClick={() => onEdit(employee)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="d-flex align-items-center">
                                        <div className="employee-avatar me-3">
                                            {employee.first_name[0]}{employee.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="fw-semibold">
                                                {employee.first_name} {employee.last_name}
                                            </div>
                                            {employee.phone && (
                                                <button
                                                    className="btn btn-link p-0 text-start text-muted"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(t('employee.confirmCall', {
                                                            name: `${employee.first_name} ${employee.last_name}`,
                                                            phone: employee.phone
                                                        }))) {
                                                            window.location.href = `tel:${employee.phone}`;
                                                        }
                                                    }}
                                                    style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                                                >
                                                    <i className="bi bi-telephone me-1"></i>
                                                    {employee.phone}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {employee.work_site_name ? (
                                        <Badge bg="secondary" className="site-badge">
                                            {employee.work_site_name}
                                        </Badge>
                                    ) : (
                                        <Badge bg="info">{t('employee.commonWorkSite')}</Badge>
                                    )}
                                </td>
                                <td>
                                    {employee.position_name || '-'}
                                </td>
                                <td>
                                    <Badge bg={getStatusBadgeVariant(employee.status)}>
                                        {t(`status.${employee.status}`)}
                                    </Badge>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <ActionButtons
                                        primaryAction={{
                                            icon: 'pencil',
                                            onClick: () => onEdit(employee),
                                            title: t('common.edit')
                                        }}
                                        dropdownActions={[
                                            ...(employee.status === 'active' ? [{
                                                icon: 'trash',
                                                label: t('employee.deactivate'),
                                                onClick: () => onDelete(employee),
                                                variant: 'danger'
                                            }] : [{
                                                icon: 'arrow-clockwise',
                                                label: t('employee.restore'),
                                                onClick: () => onRestore(employee),
                                                variant: 'success'
                                            }])
                                        ]}
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
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