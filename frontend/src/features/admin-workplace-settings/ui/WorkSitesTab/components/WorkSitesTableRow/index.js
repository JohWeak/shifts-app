// frontend/src/features/admin-workplace-settings/ui/WorkSitesTab/components/WorkSitesTableRow/index.js

import React from 'react';
import { Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import WorkplaceActionButtons from '../../../WorkplaceActionButtons';

const WorkSitesTableRow = ({
                               site,
                               onRowClick,
                               onEdit,
                               onViewEmployees,
                               onDelete,
                               onRestore
                           }) => {
    const { t } = useI18n();

    return (
        <tr
            className={`clickable-row ${!site.is_active ? 'inactive-row' : ''}`}
            onClick={() => onRowClick(site)}
            style={{ cursor: 'pointer' }}
        >
            <td className="site-name">{site.site_name}</td>
            <td>{site.address || '-'}</td>
            <td>{site.phone || '-'}</td>
            <td>
                <Badge bg={site.is_active ? 'success' : 'secondary'}>
                    {site.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
            </td>
            <td className="text-center"><Badge bg={site.positionCount > 0 ? 'info' : 'secondary'} pill>{site.positionCount || 0}</Badge></td>
            <td className="text-center"><Badge bg={site.employeeCount > 0 ? 'primary' : 'secondary'} pill>{site.employeeCount || 0}</Badge></td>
            <td>
                <WorkplaceActionButtons
                    item={site}
                    onEdit={onEdit}
                    onViewEmployees={onViewEmployees}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            </td>
        </tr>
    );
};

export default WorkSitesTableRow;