// frontend/src/features/employee-schedule/index.js
import React, { useState, useEffect } from 'react';
import { Container, Tab, Tabs, Card } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import { scheduleAPI } from 'shared/api/apiService';

// Import sub-components
import PersonalScheduleTab from './ui/PersonalScheduleTab';
import FullScheduleTab from './ui/FullScheduleTab';
import ArchiveTab from './ui/ArchiveTab';

import './index.css';

const EmployeeSchedule = () => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('personal');
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        fetchEmployeeData();
    }, []);

    const fetchEmployeeData = async () => {
        try {
            // Получаем данные о сотруднике через weekly endpoint
            const data = await scheduleAPI.fetchWeeklySchedule();
            console.log('Employee data from weekly endpoint:', data);

            if (data?.employee) {
                setEmployeeData(data.employee);
            }
        } catch (err) {
            console.error('Error fetching employee data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Проверяем наличие позиции у сотрудника
    const hasAssignedPosition = employeeData?.position_id || false;

    if (loading) {
        return (
            <Container fluid className="employee-schedule-container">
                <LoadingState message={t('common.loading')} />
            </Container>
        );
    }

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
                                    {!hasAssignedPosition && (
                                        <i className="bi bi-lock ms-2"
                                           title={t('employee.schedule.positionRequired')}
                                        ></i>
                                    )}
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

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && employeeData && (
                <div className="mt-3 p-3 bg-light small rounded">
                    <strong>Employee Debug Info:</strong>
                    <div>Name: {employeeData.name}</div>
                    <div>Position ID: {employeeData.position_id || 'None'}</div>
                    <div>Position: {employeeData.position_name || 'Not assigned'}</div>
                    <div>Site: {employeeData.site_name || 'Not assigned'}</div>
                </div>
            )}
        </Container>
    );
};

export default EmployeeSchedule;