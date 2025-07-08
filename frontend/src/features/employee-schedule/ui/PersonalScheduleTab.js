// frontend/src/features/employee-schedule/ui/PersonalScheduleTab.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Table, Alert, Badge, Button, Card } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import { scheduleAPI } from 'shared/api/apiService';
import { formatWeekRange, formatShiftTime, getDayName, formatHeaderDate } from 'shared/lib/utils/scheduleUtils';
import { parseISO, addWeeks, format } from 'date-fns';
import './PersonalScheduleTab.css';

const PersonalScheduleTab = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [nextWeekData, setNextWeekData] = useState(null);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch both current and next week schedules
            const response = await scheduleAPI.fetchWeeklySchedule();

            if (response.data.success) {
                // Parse the data to separate current and next week
                const data = response.data;
                setCurrentWeekData(data);

                // For now, we'll need to make another call for next week
                // This could be optimized on backend to return both weeks
                const nextWeekStart = addWeeks(parseISO(data.week.start), 1);
                const nextWeekResponse = await scheduleAPI.fetchWeeklySchedule(
                    format(nextWeekStart, 'yyyy-MM-dd')
                );

                if (nextWeekResponse.data.success) {
                    setNextWeekData(nextWeekResponse.data);
                }
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError(err.response?.data?.message || t('errors.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData || !weekData.schedule) return null;

        const hasPosition = user?.position_id || user?.default_position_id;
        const hasWorksite = user?.work_site_id || user?.default_site_id;

        return (
            <Card className="week-schedule-card mb-4">
                <Card.Header className="week-header">
                    <h5 className="mb-0">
                        <i className="bi bi-calendar-week me-2"></i>
                        {weekTitle}
                    </h5>
                    <Badge bg="secondary" className="week-badge">
                        {formatWeekRange(weekData.week)}
                    </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table className="personal-schedule-table mb-0" hover>
                            <thead>
                            <tr>
                                <th className="date-column">{t('employee.schedule.date')}</th>
                                <th className="day-column">{t('employee.schedule.day')}</th>
                                <th className="shift-column">{t('employee.schedule.shift')}</th>
                                {!hasPosition && <th className="position-column">{t('employee.position')}</th>}
                                {!hasWorksite && <th className="site-column">{t('employee.workSite')}</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {weekData.schedule.map((day, index) => {
                                const assignment = day.shifts.find(s =>
                                    s.employees.some(e => e.emp_id === user.emp_id)
                                );
                                const isToday = new Date().toDateString() === parseISO(day.date).toDateString();

                                return (
                                    <tr key={day.date} className={`${isToday ? 'today-row' : ''} ${!assignment ? 'day-off-row' : ''}`}>
                                        <td className="date-cell">
                                            {formatHeaderDate(parseISO(day.date))}
                                            {isToday && <Badge bg="primary" className="ms-2 today-badge">{t('common.today')}</Badge>}
                                        </td>
                                        <td className="day-cell">
                                            {getDayName(parseISO(day.date).getDay(), t)}
                                        </td>
                                        <td className="shift-cell">
                                            {assignment ? (
                                                <div className="shift-info">
                                                    <span className="shift-name">{assignment.shift_name}</span>
                                                    <span className="shift-time">
                                                            {formatShiftTime(assignment.start_time, assignment.duration)}
                                                        </span>
                                                </div>
                                            ) : (
                                                <span className="day-off">
                                                        <i className="bi bi-house-door me-1"></i>
                                                    {t('employee.schedule.dayOff')}
                                                    </span>
                                            )}
                                        </td>
                                        {!hasPosition && (
                                            <td className="position-cell">
                                                {assignment?.position_name || '-'}
                                            </td>
                                        )}
                                        {!hasWorksite && (
                                            <td className="site-cell">
                                                {assignment?.site_name || '-'}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return <LoadingState message={t('common.loading')} />;
    }

    if (error) {
        return (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
                <Alert.Heading>{t('common.error')}</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" size="sm" onClick={fetchSchedules}>
                    {t('common.tryAgain')}
                </Button>
            </Alert>
        );
    }

    if (!currentWeekData && !nextWeekData) {
        return (
            <EmptyState
                icon={<i className="bi bi-calendar-x display-1"></i>}
                title={t('employee.schedule.noSchedule')}
                description={t('employee.schedule.noScheduleDesc')}
            />
        );
    }

    return (
        <div className="personal-schedule-content">
            {renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))}
            {renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))}
        </div>
    );
};

export default PersonalScheduleTab;