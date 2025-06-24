// frontend/src/features/admin-employee-management/ui/EmployeeList/VirtualizedEmployeeList.js
import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Table, Button, Badge } from 'react-bootstrap';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const VirtualizedEmployeeList = ({
                                     employees,
                                     totalCount,
                                     onEdit,
                                     onDelete,
                                     onRestore,
                                     onLoadMore,
                                     hasNextPage,
                                     isNextPageLoading
                                 }) => {
    const { t } = useI18n();

    // Количество элементов для загрузки
    const itemCount = hasNextPage ? employees.length + 1 : employees.length;

    // Функция для проверки, загружен ли элемент
    const isItemLoaded = useCallback(
        (index) => !hasNextPage || index < employees.length,
        [hasNextPage, employees.length]
    );

    // Функция загрузки следующей страницы
    const loadMoreItems = isNextPageLoading ? () => {} : onLoadMore;

    // Рендер строки
    const Row = ({ index, style }) => {
        // Показываем загрузчик для последнего элемента
        if (!isItemLoaded(index)) {
            return (
                <div style={style} className="d-flex align-items-center justify-content-center">
                    <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            );
        }

        const employee = employees[index];

        return (
            <div style={style} className="employee-row">
                <div className="d-flex align-items-center px-3">
                    <div className="employee-cell flex-grow-1">
                        <div className="d-flex align-items-center">
                            <div className="employee-avatar me-3">
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
                    </div>

                    <div className="employee-cell" style={{ width: '200px' }}>
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
                    </div>

                    <div className="employee-cell" style={{ width: '150px' }}>
                        {employee.default_position_name ||
                            <span className="text-muted">{t('employee.noPosition')}</span>}
                    </div>

                    <div className="employee-cell" style={{ width: '100px' }}>
                        <StatusBadge
                            status={employee.status}
                            variant={
                                employee.status === 'active' ? 'success' :
                                    employee.status === 'admin' ? 'primary' :
                                        'secondary'
                            }
                        />
                    </div>

                    <div className="employee-cell text-center" style={{ width: '120px' }}>
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
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="virtualized-list-container">
            {/* Заголовок таблицы */}
            <div className="list-header sticky-top bg-white border-bottom">
                <div className="d-flex align-items-center px-3 py-2">
                    <div className="employee-cell flex-grow-1 text-muted small fw-semibold">
                        {t('employee.fullName')}
                    </div>
                    <div className="employee-cell text-muted small fw-semibold" style={{ width: '200px' }}>
                        {t('workSite.workSite')}
                    </div>
                    <div className="employee-cell text-muted small fw-semibold" style={{ width: '150px' }}>
                        {t('employee.position')}
                    </div>
                    <div className="employee-cell text-muted small fw-semibold" style={{ width: '100px' }}>
                        {t('employee.status')}
                    </div>
                    <div className="employee-cell text-center text-muted small fw-semibold" style={{ width: '120px' }}>
                        {t('common.actions')}
                    </div>
                </div>
            </div>

            {/* Виртуализированный список */}
            <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={itemCount}
                loadMoreItems={loadMoreItems}
            >
                {({ onItemsRendered, ref }) => (
                    <List
                        className="List"
                        height={600}
                        itemCount={itemCount}
                        itemSize={80}
                        onItemsRendered={onItemsRendered}
                        ref={ref}
                        width="100%"
                    >
                        {Row}
                    </List>
                )}
            </InfiniteLoader>
        </div>
    );
};

export default VirtualizedEmployeeList;