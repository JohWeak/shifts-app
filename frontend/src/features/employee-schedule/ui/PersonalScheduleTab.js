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
    const [activeWeek, setActiveWeek] = useState('current');
    const [employeeInfo, setEmployeeInfo] = useState(null);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch current week schedule
            console.log('Fetching current week schedule...');
            const currentData = await scheduleAPI.fetchWeeklySchedule();
            console.log('Current week data received:', currentData);

            if (currentData) {
                setCurrentWeekData(currentData);

                // Save employee info from first response
                if (currentData.employee) {
                    setEmployeeInfo(currentData.employee);
                }

                // Fetch next week using data from current response
                if (currentData.week?.start) {
                    const nextWeekStart = addWeeks(parseISO(currentData.week.start), 1);
                    const nextWeekDateStr = format(nextWeekStart, 'yyyy-MM-dd');

                    console.log('Fetching next week schedule for date:', nextWeekDateStr);

                    try {
                        const nextData = await scheduleAPI.fetchWeeklySchedule(nextWeekDateStr);
                        console.log('Next week data received:', nextData);

                        if (nextData) {
                            setNextWeekData(nextData);
                        }
                    } catch (nextErr) {
                        console.error('Error fetching next week:', nextErr);
                        // Не прерываем общую загрузку, если следующая неделя не загрузилась
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

    // Добавим useEffect для отладки
    useEffect(() => {
        console.log('State updated - currentWeekData:', currentWeekData);
        console.log('State updated - nextWeekData:', nextWeekData);
    }, [currentWeekData, nextWeekData]);

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData) return null;

        const employee = employeeInfo || weekData.employee;
        const hasPosition = employee?.position_id;
        const hasWorksite = employee?.site_id;

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
                                                const isAssigned = shift.employees.find(e =>
                                                    e.is_current_user ||
                                                    e.emp_id === employee?.emp_id
                                                );
                                                if (isAssigned) {
                                                    userAssignment = {
                                                        ...shift,
                                                        employee_info: isAssigned
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
                                                {getDayName(day.day_of_week ?? dateObj.getDay(), t)}
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
                                                    {userAssignment?.employee_info?.position || '-'}
                                                </td>
                                            )}
                                            {!hasWorksite && (
                                                <td className="site-cell">
                                                    {userAssignment?.employee_info?.site_name || '-'}
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

    // Display employee info if available
    const employee = employeeInfo || currentWeekData?.employee || nextWeekData?.employee;

    return (
        <div className="personal-schedule-content">
            {/* Employee info card */}
            {employee && (
                <Card className="employee-info-card mb-3">
                    <Card.Body className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{employee.name}</strong>
                                {employee.position_name && (
                                    <span className="text-muted ms-2">• {employee.position_name}</span>
                                )}
                            </div>
                            {employee.site_name && (
                                <Badge bg="info">{employee.site_name}</Badge>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            )}

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
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-3 p-3 bg-light small">
                    <strong>Debug Info:</strong>
                    <div>Current week data: {currentWeekData ? 'Loaded' : 'Not loaded'}</div>
                    <div>Next week data: {nextWeekData ? 'Loaded' : 'Not loaded'}</div>
                    <div>Active week: {activeWeek}</div>
                </div>
            )}
        </div>
    );
};

export default PersonalScheduleTab;