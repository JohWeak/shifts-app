// frontend/src/features/admin-employee-management/ui/EmployeeList/EmployeeList.js
import React from 'react';
import { Card, Table, Button, Badge, Spinner, Pagination } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import './EmployeeList.css';

const EmployeeList = ({
                          employees,
                          loading,
                          onEdit,
                          onDelete,
                          pagination,
                          onPageChange
                      }) => {
    const { t } = useI18n();

    if (loading) {
        return (
            <Card className="employee-list-card">
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">{t('common.loading')}</span>
                    </Spinner>
                </Card.Body>
            </Card>
        );
    }

    if (!employees || employees.length === 0) {
        return (
            <Card className="employee-list-card">
                <Card.Body className="text-center py-5">
                    <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                    <p className="text-muted">{t('employee.noEmployees')}</p>
                </Card.Body>
            </Card>
        );
    }

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    return (
        <Card className="employee-list-card">
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table hover className="employee-table mb-0">
                        <thead>
                        <tr>
                            <th>{t('employee.fullName')}</th>
                            <th>{t('employee.email')}</th>
                            <th>{t('employee.position')}</th>
                            <th>{t('employee.status')}</th>
                            <th className="text-center">{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.emp_id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="employee-avatar me-3">
                                            {employee.first_name[0]}{employee.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="fw-semibold">
                                                {employee.first_name} {employee.last_name}
                                            </div>
                                            <small className="text-muted">
                                                {t('employee.login')}: {employee.login}
                                            </small>
                                        </div>
                                    </div>
                                </td>
                                <td>{employee.email}</td>
                                <td>
                                    {employee.default_position_name ||
                                        <span className="text-muted">{t('employee.noPosition')}</span>}
                                </td>
                                <td>
                                    <StatusBadge
                                        status={employee.status}
                                        variant={
                                            employee.status === 'active' ? 'success' :
                                                employee.status === 'admin' ? 'primary' :
                                                    'secondary'
                                        }
                                    />
                                </td>
                                <td className="text-center">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => onEdit(employee)}
                                        title={t('common.edit')}
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => onDelete(employee)}
                                        title={t('common.delete')}
                                        disabled={employee.status === 'admin'}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-center p-3 border-top">
                        <Pagination size="sm">
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
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default EmployeeList;