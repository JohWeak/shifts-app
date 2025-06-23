// frontend/src/features/admin-employee-management/ui/EmployeeList/EmployeeList.js
import React from 'react';
import { Card, Table, Button, Badge, Spinner, Pagination, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import './EmployeeList.css';

const EmployeeList = ({
                          employees,
                          loading,
                          onEdit,
                          onDelete,
                          onRestore,
                          pagination,
                          onPageChange,
                          onPageSizeChange
                      }) => {
    const { t } = useI18n();

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const showPagination = totalPages > 1;

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
                    <>
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

                        <div className="pagination-info">
                            {t('common.showing')} {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('common.of')} {pagination.total}
                        </div>
                    </>
                )}
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
                            <th>{t('employee.fullName')}</th>
                            <th>{t('workSite.workSite')}</th>
                            <th>{t('employee.position')}</th>
                            <th>{t('employee.status')}</th>
                            <th className="text-center">{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.emp_id} className={employee.status === 'inactive' ? 'inactive-row' : ''}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="employee-avatar me-3">
                                            {employee.first_name[0]}{employee.last_name[0]}
                                        </div>
                                        <div className="fw-semibold">
                                            {employee.first_name} {employee.last_name}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {employee.work_site_name ? (
                                        <Badge bg="info" className="site-badge">
                                            <i className="bi bi-building me-1"></i>
                                            {employee.work_site_name}
                                        </Badge>
                                    ) : (
                                        <Badge bg="secondary" className="site-badge common">
                                            <i className="bi bi-globe me-1"></i>
                                            {t('employee.commonWorkSite')}
                                        </Badge>
                                    )}
                                </td>
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
                                        variant="link"
                                        size="sm"
                                        className="action-btn me-2"
                                        onClick={() => onEdit(employee)}
                                        title={t('common.edit')}
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </Button>
                                    {employee.status === 'inactive' ? (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="action-btn text-success"
                                            onClick={() => onRestore(employee)}
                                            title={t('employee.restore')}
                                        >
                                            <i className="bi bi-arrow-clockwise"></i>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="action-btn text-danger"
                                            onClick={() => onDelete(employee)}
                                            title={t('common.delete')}
                                            disabled={employee.status === 'admin'}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
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