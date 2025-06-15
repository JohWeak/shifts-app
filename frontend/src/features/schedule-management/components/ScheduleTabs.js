// frontend/src/features/schedule-management/components/ScheduleTabs.js
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';

const ScheduleTabs = ({ activeTab, onTabChange, isDetailsDisabled, children }) => {
    const { t } = useI18n();

    return (
        <Tabs activeKey={activeTab} onSelect={onTabChange} className="mb-4">
            <Tab eventKey="overview" title={t('schedule.overview')}>
                {children.overview}
            </Tab>
            <Tab
                eventKey="view"
                title={t('schedule.details')}
                disabled={isDetailsDisabled}
            >
                {children.details}
            </Tab>
        </Tabs>
    );
};

export default ScheduleTabs;
