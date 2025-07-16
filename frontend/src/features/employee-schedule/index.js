// frontend/src/features/employee-schedule/index.js
import React, { useState, useEffect } from 'react';
import { Container, Tab, Tabs, Card, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useSelector } from 'react-redux';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import { scheduleAPI } from 'shared/api/apiService';

// Import sub-components
import PersonalScheduleView from './ui/PersonalScheduleView';
import FullScheduleView from './ui/FullScheduleView';

import './index.css';

const EmployeeSchedule = () => {
    const { t, direction } = useI18n();
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
    const headerActions = hasAssignedPosition ? (
        <Form.Check
            type="switch"
            id="full-schedule-toggle"
            label={t('employee.schedule.fullView')}
            checked={showFullSchedule}
            onChange={(e) => setShowFullSchedule(e.target.checked)}
            className="full-schedule-toggle"
            reverse={direction === 'ltr'}
        />
    ) : null;

    return (
        <Container fluid className="employee-schedule-container">
            <PageHeader
                icon="calendar-week"
                title={t('employee.schedule.title')}
                subtitle={t('employee.schedule.subtitle')}
                actions={headerActions}
            />

            {showFullSchedule && hasAssignedPosition ? (
                <FullScheduleView employeeData={employeeData} />
            ) : (
                <PersonalScheduleView employeeData={employeeData} />
            )}
        </Container>
    );
};

export default EmployeeSchedule;