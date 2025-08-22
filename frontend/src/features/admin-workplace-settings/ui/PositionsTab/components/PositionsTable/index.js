// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionsTable/index.js

import React, {useMemo} from 'react';
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

    const positionTableHeaders = useMemo(() => [
        {
            key: 'name',
            label: t('workplace.positions.name')
        },
        {
            key: 'site',
            label: t('workplace.worksites.title')
        },
        {
            key: 'profession',
            label: t('workplace.positions.profession')
        },
        {
            key: 'defaultStaff',
            label: t('workplace.positions.defaultStaff')
        },
        {
            key: 'shifts',
            label: t('workplace.positions.shifts')
        },
        {
            key: 'employees',
            label: t('workplace.positions.employees')
        },
        {
            key: 'status',
            label: t('common.status')
        },
        {
            label: t('common.actions'),
            isSortable: false,
            thProps: {
                className: 'sortable-header text-center px-4'
            }
        }
    ], [t]);

    return (
        <Table responsive hover className="positions-table">
            <thead>
            <tr>
                {positionTableHeaders.map(header => (
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