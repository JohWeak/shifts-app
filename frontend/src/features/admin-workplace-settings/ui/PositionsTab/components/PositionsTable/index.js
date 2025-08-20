// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionsTable/index.js

import React from 'react';
import { Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import PositionsTableRow from '../PositionsTableRow';
import './PositionsTable.css';

const PositionsTable = ({
                            positions,
                            sortConfig,
                            requestSort,
                            expandedPositionId,
                            isClosingPositionId,
                            onRowClick,
                            onEdit,
                            onViewEmployees,
                            onDelete,
                            onRestore,
                            getSiteName
                        }) => {
    const { t } = useI18n();

    return (
        <Table responsive hover className="positions-table">
            <thead>
            <tr>
                <SortableHeader
                    sortKey="name"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('workplace.positions.name')}
                </SortableHeader>

                <SortableHeader
                    sortKey="site"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('workplace.worksites.title')}
                </SortableHeader>

                <SortableHeader
                    sortKey="profession"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('workplace.positions.profession')}
                </SortableHeader>

                <SortableHeader
                    sortKey="defaultStaff"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('workplace.positions.defaultStaff')}
                </SortableHeader>

                <SortableHeader
                    sortKey="shifts"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('workplace.positions.shifts')}
                </SortableHeader>

                <SortableHeader
                    sortKey="employees"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('workplace.positions.employees')}
                </SortableHeader>

                <SortableHeader
                    sortKey="status"
                    sortConfig={sortConfig}
                    onSort={requestSort}
                >
                    {t('common.status')}
                </SortableHeader>

                <th className="text-muted text-center">
                    {t('common.actions')}
                </th>
            </tr>
            </thead>
            <tbody>
            {positions.map(position => (
                <PositionsTableRow
                    key={position.pos_id}
                    position={position}
                    getSiteName={getSiteName}
                    isExpanded={expandedPositionId === position.pos_id}
                    isClosing={isClosingPositionId === position.pos_id}
                    onRowClick={onRowClick}
                    onEdit={onEdit}
                    onViewEmployees={onViewEmployees}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            ))}
            </tbody>
        </Table>
    );
};

export default PositionsTable;