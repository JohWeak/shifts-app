// frontend/src/features/admin-workplace-settings/ui/WorkSitesTab/components/WorkSitesTable/index.js

import React, {useMemo} from 'react';
import {Table} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import SortableHeader from 'shared/ui/components/SortableHeader';
import WorkSitesTableRow from '../WorkSitesTableRow';

const WorkSitesTable = ({
                            sites,
                            sortConfig,
                            requestSort,
                            ...rowProps
                        }) => {
    const {t} = useI18n();

    const tableHeaders = useMemo(() => [
        {key: 'name', label: t('workplace.worksites.name')},
        {key: 'address', label: t('workplace.worksites.address')},
        {key: 'phone', label: t('workplace.worksites.phone')},
        {key: 'positions', label: t('workplace.worksites.positions')},
        {key: 'employees', label: t('workplace.worksites.employees')},
        {key: 'status', label: t('common.status')},
        {label: t('common.actions'), isSortable: false, thProps: {className: 'sortable-header ps-5'}},
    ], [t]);

    return (
        <Table responsive hover className="workplace-table">
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
            <tbody>
            {sites.map(site => (
                <WorkSitesTableRow
                    key={site.site_id}
                    site={site}
                    {...rowProps}
                />
            ))}
            </tbody>
        </Table>
    );
};

export default WorkSitesTable;