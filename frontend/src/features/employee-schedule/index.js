// frontend/src/features/employee-schedule/index.js
import React, { useState, useEffect } from 'react';
import { Container, Tab, Tabs, Card, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useSelector } from 'react-redux';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import { scheduleAPI } from 'shared/api/apiService';

// Import sub-components
import {
    PersonalScheduleTab,
    FullScheduleTab,
    ArchiveTab
} from './ui';


import './index.css';

const EmployeeSchedule = () => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('personal');
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [employeeData, setEmployeeData] = useState(null);

    // Состояние для переключателя Full Schedule
    const [showFullSchedule, setShowFullSchedule] = useState(() => {
        const saved = localStorage.getItem('employee_showFullSchedule');
        return saved !== null ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        fetchEmployeeData();
    }, []);

    useEffect(() => {
        localStorage.setItem('employee_showFullSchedule', JSON.stringify(showFullSchedule));
    }, [showFullSchedule]);

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

    // Элемент переключателя для PageHeader
    const headerExtra = hasAssignedPosition ? (
        <Form.Check
            type="switch"
            id="full-schedule-toggle"
            label={t('employee.schedule.fullSchedule')}
            checked={showFullSchedule}
            onChange={(e) => setShowFullSchedule(e.target.checked)}
            className="full-schedule-toggle"
        />
    ) : null;

    return (
        <Container fluid className="employee-schedule-container">
            <PageHeader
                icon="calendar-week"
                title={t('employee.schedule.title')}
                subtitle={t('employee.schedule.subtitle')}
                actions={headerExtra}
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
                                    <i className="bi bi-calendar-week me-2"></i>
                                    {t('employee.schedule.title')}
                                </span>
                            }
                        >
                            <div className="tab-content-wrapper">
                                {showFullSchedule && hasAssignedPosition ? (
                                    <FullScheduleTab />
                                ) : (
                                    <PersonalScheduleTab />
                                )}
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