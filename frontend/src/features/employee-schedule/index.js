// frontend/src/features/employee-schedule/index.js
import React, { useState, useEffect } from 'react';
import { Container, Tab, Tabs, Card } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';

// Import sub-components
import PersonalScheduleTab from './ui/PersonalScheduleTab';
import FullScheduleTab from './ui/FullScheduleTab';
import ArchiveTab from './ui/ArchiveTab';

import './index.css';

const EmployeeSchedule = () => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('personal');
    const { user } = useSelector(state => state.auth);
    const { loading } = useSelector(state => state.schedule || {});

    // Check if user has assigned position for full schedule access
    const hasAssignedPosition = user?.position_id || user?.default_position_id;

    return (
        <Container fluid className="employee-schedule-container">
            <PageHeader
                icon="calendar-week"
                title={t('employee.schedule.title')}
                subtitle={t('employee.schedule.subtitle')}
            />

            <Card className="schedule-card shadow-sm">
                <Card.Body className="p-0">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="employee-schedule-tabs"
                        fill
                    >
                        <Tab
                            eventKey="personal"
                            title={
                                <span>
                                    <i className="bi bi-person-calendar me-2"></i>
                                    {t('employee.schedule.personalSchedule')}
                                </span>
                            }
                        >
                            <div className="tab-content-wrapper">
                                <PersonalScheduleTab />
                            </div>
                        </Tab>

                        <Tab
                            eventKey="full"
                            title={
                                <span>
                                    <i className="bi bi-calendar3 me-2"></i>
                                    {t('employee.schedule.fullSchedule')}
                                </span>
                            }
                            disabled={!hasAssignedPosition}
                        >
                            <div className="tab-content-wrapper">
                                <FullScheduleTab />
                            </div>
                        </Tab>

                        <Tab
                            eventKey="archive"
                            title={
                                <span>
                                    <i className="bi bi-archive me-2"></i>
                                    {t('employee.schedule.archive')}
                                </span>
                            }
                        >
                            <div className="tab-content-wrapper">
                                <ArchiveTab />
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EmployeeSchedule;