// frontend/src/features/schedule-management/components/ScheduleTabs.js
import React from 'react';
import { Button } from 'react-bootstrap';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';

const ScheduleTabs = ({ activeTab, onTabChange, isDetailsDisabled, children, onBackClick }) => {
    const { t } = useI18n();

    // If we're viewing details, show back button instead of tabs
    if (activeTab === 'view' && !isDetailsDisabled) {
        return (
            <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onBackClick}
                        className="me-3"
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        {t('common.back')}
                    </Button>
                </div>
                {children.details}
            </div>
        );
    }

    // Otherwise show the overview
    return (
        <div className="mb-4">
            {children.overview}
        </div>
    );
};

export default ScheduleTabs;