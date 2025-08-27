// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionsTableRow/index.js

import React from 'react';
import { Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import WorkplaceActionButtons from '../../../WorkplaceActionButtons';
import PositionShiftsExpanded from '../PositionShiftsExpanded/';

const PositionsTableRow = ({
                               position,
                               getSiteName,
                               isExpanded,
                               isClosing,
                               onRowClick,
                               onEdit,
                               onViewEmployees,
                               onDelete,
                               onRestore,
                           }) => {
    const { t } = useI18n();

    return (
        <React.Fragment>
            <tr
                className={`position-row ${!position.is_active ? 'inactive-row' : ''} ${isExpanded ? 'expanded' : ''}`}
                onClick={() => onRowClick(position)}
                style={{ cursor: 'pointer' }}
            >
                <td>
                    <i className={`bi bi-chevron-right me-2 transition-icon`}></i>
                    {position.pos_name}
                </td>
                <td>
                    <Badge bg="secondary" className="site-badge">{getSiteName(position.site_id)}</Badge>
                </td>
                <td>{position.profession || '-'}</td>
                <td className="text-center"><Badge bg="info">{position.num_of_emp || 1}</Badge></td>
                <td className="text-center"><Badge bg="warning" text="dark">{position.totalShifts || 0}</Badge></td>
                <td className="text-center"><Badge bg="primary">{position.totalEmployees || 0}</Badge></td>
                <td>
                    <Badge bg={position.is_active ? 'success' : 'secondary'}>
                        {position.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                    <WorkplaceActionButtons
                        item={position}
                        onEdit={onEdit}
                        onViewEmployees={onViewEmployees}
                        onDelete={onDelete}
                        onRestore={onRestore}
                    />
                </td>
            </tr>
            {isExpanded && (
                <PositionShiftsExpanded
                    position={position}
                    isClosing={isClosing}
                />
            )}
        </React.Fragment>
    );
};

export default PositionsTableRow;