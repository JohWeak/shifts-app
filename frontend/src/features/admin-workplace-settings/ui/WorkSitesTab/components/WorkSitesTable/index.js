// frontend/src/features/admin-workplace-settings/ui/WorkSitesTab/components/WorkSitesTable/index.js

import React from 'react';
import { Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import WorkSitesTableRow from '../WorkSitesTableRow';

const WorkSitesTable = ({
                            sites,
                            sortConfig,
                            requestSort,
                            ...rowProps
                        }) => {
    const { t } = useI18n();

    return (
        <Table responsive hover className="workplace-table">
            <thead>
            <tr>
                <SortableHeader sortKey="name" sortConfig={sortConfig} onSort={requestSort}>{t('workplace.worksites.name')}</SortableHeader>
                <SortableHeader sortKey="address" sortConfig={sortConfig} onSort={requestSort}>{t('workplace.worksites.address')}</SortableHeader>
                <SortableHeader sortKey="phone" sortConfig={sortConfig} onSort={requestSort}>{t('workplace.worksites.phone')}</SortableHeader>
                <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={requestSort}>{t('common.status')}</SortableHeader>
                <SortableHeader sortKey="positions" sortConfig={sortConfig} onSort={requestSort}>{t('workplace.worksites.positions')}</SortableHeader>
                <SortableHeader sortKey="employees" sortConfig={sortConfig} onSort={requestSort}>{t('workplace.worksites.employees')}</SortableHeader>
                <th className="text-muted text-center">{t('common.actions')}</th>
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