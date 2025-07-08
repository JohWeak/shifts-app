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
            // Fetch current week schedule
            const response = await scheduleAPI.fetchWeeklySchedule();
            console.log('Current week response:', response);

            if (response?.data?.success) {
                const data = response.data;
                setCurrentWeekData(data);

                // Fetch next week schedule
                if (data.week && data.week.start) {
                    const nextWeekStart = addWeeks(parseISO(data.week.start), 1);
                    const nextWeekResponse = await scheduleAPI.fetchWeeklySchedule(
                        format(nextWeekStart, 'yyyy-MM-dd')
                    );
                    console.log('Next week response:', nextWeekResponse);

                    if (nextWeekResponse?.data?.success) {
                        setNextWeekData(nextWeekResponse.data);
                    }
                }
            } else {
                // Если success false, но есть сообщение
                if (response?.data?.message) {
                    console.log('Schedule message:', response.data.message);
                }
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError(err.response?.data?.message || err.message || t('errors.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData || !weekData.schedule) return null;

        const hasPosition = user?.position_id || user?.default_position_id;
        const hasWorksite = user?.work_site_id || user?.default_site_id;

        // Если расписание пустое
        if (weekData.schedule.length === 0) {
            return (
                <Card className="week-schedule-card mb-4">
                    <Card.Header className="week-header">
                        <h5 className="mb-0">
                            <i className="bi bi-calendar-week me-2"></i>
                            {weekTitle}
                        </h5>
                        {weekData.week && (
                            <Badge bg="secondary" className="week-badge">
                                {formatWeekRange(weekData.week)}
                            </Badge>
                        )}
                    </Card.Header>
                    <Card.Body className="text-center py-4">
                        <p className="text-muted mb-0">
                            <i className="bi bi-calendar-x me-2"></i>
                            {t('employee.schedule.noSchedule')}
                        </p>
                    </Card.Body>
                </Card>
            );
        }

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
                                // Ищем смену текущего пользователя
                                let userAssignment = null;

                                if (day.shifts && day.shifts.length > 0) {
                                    for (const shift of day.shifts) {
                                        const employee = shift.employees?.find(e => e.emp_id === user.emp_id);
                                        if (employee) {
                                            userAssignment = {
                                                ...shift,
                                                position_name: employee.position,
                                                // site_name нужно добавить в ответ API если требуется
                                            };
                                            break;
                                        }
                                    }
                                }

                                const isToday = new Date().toDateString() === parseISO(day.date).toDateString();

                                return (
                                    <tr key={day.date} className={`${isToday ? 'today-row' : ''} ${!userAssignment ? 'day-off-row' : ''}`}>
                                        <td className="date-cell">
                                            {formatHeaderDate(parseISO(day.date))}
                                            {isToday && <Badge bg="primary" className="ms-2 today-badge">{t('common.today')}</Badge>}
                                        </td>
                                        <td className="day-cell">
                                            {day.day_name || getDayName(parseISO(day.date).getDay(), t)}
                                        </td>
                                        <td className="shift-cell">
                                            {userAssignment ? (
                                                <div className="shift-info">
                                                    <span className="shift-name">{userAssignment.shift_name}</span>
                                                    <span className="shift-time">
                                                            {formatShiftTime(userAssignment.start_time, userAssignment.duration)}
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
                                                {userAssignment?.position_name || '-'}
                                            </td>
                                        )}
                                        {!hasWorksite && (
                                            <td className="site-cell">
                                                {userAssignment?.site_name || '-'}
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