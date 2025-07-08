// frontend/src/features/employee-schedule/ui/FullScheduleTab.js
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Table, Alert, Card, Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import api from 'shared/api';
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
    const tableRef = useRef(null);

    const positionId = user?.position_id || user?.default_position_id;

    useEffect(() => {
        if (positionId) {
            fetchFullSchedule();
        }
    }, [positionId]);

    const fetchFullSchedule = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/api/schedules/position/${positionId}/weekly`);

            if (response.data.success) {
                setScheduleData(response.data);
            }
        } catch (err) {
            console.error('Error fetching full schedule:', err);
            setError(err.response?.data?.message || t('errors.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const renderShiftCell = (shift, employees) => {
        const isCurrentUser = employees.some(emp => emp.emp_id === user.emp_id);
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
                            className={`employee-name ${emp.emp_id === user.emp_id ? 'fw-bold' : ''}`}
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

    return (
        <div className="full-schedule-content">
            <Card className="position-info-card mb-3">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-1">{position.name}</h6>
                        <small className="text-muted">{position.site_name}</small>
                    </div>
                    <Badge bg="primary">
                        {formatWeekRange(week)}
                    </Badge>
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