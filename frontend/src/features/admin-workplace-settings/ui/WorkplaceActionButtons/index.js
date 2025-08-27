// frontend/src/features/admin-workplace-settings/ui/WorkplaceActionButtons/index.js

import React from 'react';
import { Button } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './WorkplaceActionButtons.css';

const WorkplaceActionButtons = ({
                                    item,
                                    onEdit,
                                    onViewEmployees,
                                    onDelete,
                                    onRestore
                                }) => {
    const { t } = useI18n();

    const handleActionClick = (e, action) => {
        e.stopPropagation();
        if (action) {
            action(item);
        }
    };

    return (
        <div className="workplace-actions">
            <Button
                variant="primary"
                size="sm"
                onClick={(e) => handleActionClick(e, onEdit)}
                title={t('common.edit')}
            >
                <i className="bi bi-pencil"></i>
            </Button>

            {onViewEmployees && (
                <Button
                    variant="info"
                    size="sm"
                    onClick={(e) => handleActionClick(e, onViewEmployees)}
                    title={t('workplace.positions.viewEmployees')}
                >
                    <i className="bi bi-people"></i>
                </Button>
            )}

            {item.is_active ? (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => handleActionClick(e, onDelete)}
                    title={t('common.delete')}
                >
                    <i className="bi bi-trash"></i>
                </Button>
            ) : (
                <Button
                    variant="success"
                    size="sm"
                    onClick={(e) => handleActionClick(e, onRestore)}
                    title={t('common.restore')}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                </Button>
            )}
        </div>
    );
};

export default WorkplaceActionButtons;