// frontend/src/features/employee-schedule/ui/PersonalScheduleTab.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Table, Alert, Badge, Button, Card, Row, Col } from 'react-bootstrap';
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
    const [activeWeek, setActiveWeek] = useState('current'); // 'current' or 'next'

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch current week schedule
            console.log('Fetching current week schedule...');
            const currentResponse = await scheduleAPI.fetchWeeklySchedule();
            console.log('Current week response:', currentResponse);


            if (currentResponse?.data) {
                setCurrentWeekData(currentResponse.data);

                // Always try to fetch next week
                if (currentResponse.data.week?.start) {
                    const nextWeekStart = addWeeks(parseISO(currentResponse.data.week.start), 1);
                    const nextWeekDateStr = format(nextWeekStart, 'yyyy-MM-dd');

                    console.log('Fetching next week schedule for date:', nextWeekDateStr);
                    const nextResponse = await scheduleAPI.fetchWeeklySchedule(nextWeekDateStr);
                    console.log('Next week response:', nextResponse);

                    if (nextResponse?.data) {
                        setNextWeekData(nextResponse.data);
                    }
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
        if (!weekData) return null;

        const hasPosition = user?.position_id || user?.default_position_id;
        const hasWorksite = user?.work_site_id || user?.default_site_id;

        // Check if we have schedule data
        const hasSchedule = weekData.schedule && weekData.schedule.length > 0;

        return (
            <Card className="week-schedule-card">
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
                <Card.Body className="p-0">
                    {!hasSchedule ? (
                        <div className="text-center py-4">
                            <p className="text-muted mb-0">
                                <i className="bi bi-calendar-x me-2"></i>
                                {weekData.message || t('employee.schedule.noSchedule')}
                            </p>
                        </div>
                    ) : (
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
                                    // Find user's assignment for this day
                                    let userAssignment = null;

                                    if (day.shifts && Array.isArray(day.shifts)) {
                                        for (const shift of day.shifts) {
                                            if (shift.employees && Array.isArray(shift.employees)) {
                                                const employee = shift.employees.find(e =>
                                                    e.emp_id === user.emp_id || e.emp_id === user.id
                                                );
                                                if (employee) {
                                                    userAssignment = {
                                                        ...shift,
                                                        position_name: employee.position,
                                                        is_current_user: true
                                                    };
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    const dateObj = parseISO(day.date);
                                    const isToday = new Date().toDateString() === dateObj.toDateString();

                                    return (
                                        <tr key={day.date} className={`${isToday ? 'today-row' : ''} ${!userAssignment ? 'day-off-row' : ''}`}>
                                            <td className="date-cell">
                                                {formatHeaderDate(dateObj)}
                                                {isToday && (
                                                    <Badge bg="primary" className="ms-2 today-badge">
                                                        {t('common.today')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="day-cell">
                                                {day.day_name || getDayName(dateObj.getDay(), t)}
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
                    )}
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

    // Show appropriate content based on available data
    const hasAnyData = currentWeekData || nextWeekData;

    if (!hasAnyData) {
        return (
            <EmptyState
                icon={<i className="bi bi-calendar-x display-1"></i>}
                title={t('employee.schedule.noSchedule')}
                description={t('employee.schedule.noScheduleDesc')}
            />
        );
    }

    // Tabs view for switching between weeks
    return (
        <div className="personal-schedule-content">
            {/* Week selector buttons */}
            <div className="week-selector mb-3">
                <Button
                    variant={activeWeek === 'current' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveWeek('current')}
                    className="me-2"
                >
                    {t('employee.schedule.currentWeek')}
                </Button>
                <Button
                    variant={activeWeek === 'next' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveWeek('next')}
                >
                    {t('employee.schedule.nextWeek')}
                </Button>
            </div>

            {/* Display selected week */}
            {activeWeek === 'current' && currentWeekData && (
                renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))
            )}

            {activeWeek === 'next' && nextWeekData && (
                renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))
            )}

            {/* If selected week has no data */}
            {((activeWeek === 'current' && !currentWeekData) ||
                (activeWeek === 'next' && !nextWeekData)) && (
                <Card className="text-center py-4">
                    <Card.Body>
                        <p className="text-muted mb-0">
                            <i className="bi bi-calendar-x me-2"></i>
                            {t('employee.schedule.noScheduleForThisWeek')}
                        </p>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default PersonalScheduleTab;