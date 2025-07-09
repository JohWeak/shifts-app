// frontend/src/features/employee-schedule/ui/FullScheduleTab.js
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Table, Alert, Card, Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import api from 'shared/api';
import { scheduleAPI } from 'shared/api/apiService';
import { formatWeekRange, formatShiftTime, getDayName, formatHeaderDate } from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';
import { parseISO } from 'date-fns';
import './FullScheduleTab.css';

const FullScheduleTab = () => {
    const { t } = useI18n();
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scheduleData, setScheduleData] = useState(null);
    const [employeeData, setEmployeeData] = useState(null);
    const tableRef = useRef(null);

    useEffect(() => {
        fetchEmployeeData();
    }, []);

    const fetchEmployeeData = async () => {
        try {
            console.log('Fetching employee data...');
            // Используем тот же endpoint что и в PersonalScheduleTab
            const data = await scheduleAPI.fetchWeeklySchedule();
            console.log('Employee data received:', data);

            if (data?.employee) {
                setEmployeeData(data.employee);

                // Если у сотрудника есть позиция, загружаем полное расписание
                if (data.employee.position_id) {
                    await fetchFullSchedule(data.employee.position_id);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching employee data:', err);
            setError(err.response?.data?.message || t('errors.fetchFailed'));
            setLoading(false);
        }
    };

    const fetchFullSchedule = async (positionId) => {
        try {
            console.log('Fetching full schedule for position:', positionId);
            const response = await api.get(`/api/schedules/position/${positionId}/weekly`);
            console.log('Full schedule response:', response);

            if (response.data?.success) {
                setScheduleData(response.data);
            } else {
                setError(t('employee.schedule.noSchedule'));
            }
        } catch (err) {
            console.error('Error fetching full schedule:', err);
            // Если endpoint не существует, показываем заглушку
            if (err.response?.status === 404) {
                setError(t('employee.schedule.fullScheduleNotAvailable'));
            } else {
                setError(err.response?.data?.message || t('errors.fetchFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const renderShiftCell = (shift, employees) => {
        const isCurrentUser = employees.some(emp =>
            emp.emp_id === employeeData?.emp_id || emp.emp_id === user?.id
        );
        const bgColor = shift.color || '#e9ecef';
        const textColor = getContrastTextColor(bgColor);

        return (
            <div
                className={`shift-cell ${isCurrentUser ? 'current-user-shift' : ''}`}
                style={{
                    backgroundColor: bgColor,
                    color: textColor
                }}
            >
                <div className="shift-name">{shift.shift_name}</div>
                <div className="shift-time">
                    {formatShiftTime(shift.start_time, shift.duration)}
                </div>
                <div className="shift-employees">
                    {employees.map((emp, idx) => (
                        <div
                            key={emp.emp_id}
                            className={`employee-name ${
                                emp.emp_id === employeeData?.emp_id || emp.emp_id === user?.id
                                    ? 'fw-bold'
                                    : ''
                            }`}
                        >
                            {emp.name}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return <LoadingState message={t('common.loading')} />;
    }

    // Проверяем, есть ли у сотрудника позиция
    if (!employeeData?.position_id) {
        return (
            <EmptyState
                icon={<i className="bi bi-person-x display-1"></i>}
                title={t('employee.schedule.positionRequired')}
                description={t('employee.schedule.positionRequiredDesc')}
            />
        );
    }

    if (error) {
        return (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
            </Alert>
        );
    }

    if (!scheduleData) {
        return (
            <EmptyState
                icon={<i className="bi bi-calendar-x display-1"></i>}
                title={t('employee.schedule.noSchedule')}
                description={t('employee.schedule.noScheduleDesc')}
            />
        );
    }

    const { week, position, shifts, days } = scheduleData;

    // Временное решение - если нет структуры данных, показываем простое сообщение
    if (!days || !shifts) {
        return (
            <Card className="text-center py-5">
                <Card.Body>
                    <h5>{t('employee.schedule.fullScheduleComingSoon')}</h5>
                    <p className="text-muted">
                        {t('employee.schedule.positionScheduleWillBeAvailable')}
                    </p>
                    <div className="mt-3">
                        <Badge bg="info" className="me-2">{employeeData.position_name}</Badge>
                        {employeeData.site_name && <Badge bg="secondary">{employeeData.site_name}</Badge>}
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div className="full-schedule-content">
            <Card className="position-info-card mb-3">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-1">{position?.name || employeeData.position_name}</h6>
                        <small className="text-muted">
                            {position?.site_name || employeeData.site_name}
                        </small>
                    </div>
                    {week && (
                        <Badge bg="primary">
                            {formatWeekRange(week)}
                        </Badge>
                    )}
                </Card.Body>
            </Card>

            <div className="table-container" ref={tableRef}>
                <div className="table-scroll-wrapper">
                    <Table className="full-schedule-table" bordered>
                        <thead>
                        <tr>
                            <th className="shift-header-cell sticky-column">
                                {t('employee.schedule.shift')}
                            </th>
                            {days.map(day => (
                                <th key={day.date} className="day-header-cell">
                                    <div className="day-name">
                                        {getDayName(parseISO(day.date).getDay(), t)}
                                    </div>
                                    <div className="day-date">
                                        {formatHeaderDate(parseISO(day.date))}
                                    </div>
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {shifts.map(shift => (
                            <tr key={shift.id}>
                                <td className="shift-info-cell sticky-column">
                                    <div className="shift-header-info">
                                        <span className="shift-header-name">{shift.shift_name}</span>
                                        <span className="shift-header-time">
                                                {formatShiftTime(shift.start_time, shift.duration)}
                                            </span>
                                    </div>
                                </td>
                                {days.map(day => {
                                    const dayShift = day.shifts.find(s => s.shift_id === shift.id);
                                    const employees = dayShift?.employees || [];

                                    return (
                                        <td key={`${day.date}-${shift.id}`} className="employee-cell">
                                            {employees.length > 0 ? (
                                                renderShiftCell(shift, employees)
                                            ) : (
                                                <div className="empty-shift">-</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
            </div>

            <div className="legend mt-3">
                <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    {t('employee.schedule.yourShiftsHighlighted')}
                </small>
            </div>
        </div>
    );
};

export default FullScheduleTab;