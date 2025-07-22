// frontend/src/features/employee-schedule/ui/FullScheduleView.js
import React, {useState, useRef} from 'react';
import {Table, Card, Badge, Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {
    formatShiftTime,
    getDayName,
    formatHeaderDate,
    formatEmployeeName,
    formatWeekRange
} from 'shared/lib/utils/scheduleUtils';
import {getContrastTextColor} from 'shared/lib/utils/colorUtils';
import {parseISO} from 'date-fns';
import {ScheduleHeaderCard} from './ScheduleHeaderCard/ScheduleHeaderCard';
import './FullScheduleView.css';

const FullScheduleView = ({ user, scheduleData, employeeData, getShiftColor, openColorPicker }) => {
    const {t, locale} = useI18n();
    const tableRef = useRef(null);

    const currentWeekData = scheduleData?.current;
    const nextWeekData = scheduleData?.next;

    const [showFullName, setShowFullName] = useState(() => {
        const saved = localStorage.getItem('employee_showFullName');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const handleNameDisplayToggle = (checked) => {
        setShowFullName(checked);
        localStorage.setItem('employee_showFullName', JSON.stringify(checked));
    };

    const renderShiftCell = (shift, employees, onNameClick) => {
        const hasCurrentUser = employees.some(emp =>
            emp.is_current_user || emp.emp_id === employeeData?.emp_id || emp.emp_id === user?.id
        );
        const bgColor = getShiftColor({...shift, shift_id: shift.id});
        const textColor = getContrastTextColor(bgColor);

        return (
            <div
                className={`shift-cell ${hasCurrentUser ? 'current-user-shift' : ''}`}
                style={{backgroundColor: bgColor, color: textColor}}
                onClick={onNameClick}
                title={t('employee.schedule.toggleNameFormatHint')}
            >
                <div className="shift-employees">
                    {employees.length > 0 ? (
                        employees.map((emp) => {
                            const [firstName, ...lastNameParts] = emp.name.split(' ');
                            const lastName = lastNameParts.join(' ');
                            return (
                                <div
                                    key={emp.emp_id}
                                    className={`employee-name ${emp.is_current_user || emp.emp_id === employeeData?.emp_id ? 'fw-bold' : ''}`}
                                    style={{color: textColor}}
                                >
                                    {formatEmployeeName(firstName, lastName, showFullName)}
                                </div>
                            );
                        })
                    ) : (
                        <span className="empty-slot">-</span>
                    )}
                </div>
            </div>
        );
    };

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData || !weekData.days || weekData.days.length === 0) {
            return null;
        }

        const {week, position, shifts, days} = weekData;

        return (
            <Card className="week-schedule-section mb-4 p-0">
                <ScheduleHeaderCard
                    className="position-info-card mb-1"
                    title={weekTitle}
                    site={position?.site_name || employeeData?.site_name}
                    position={position?.name || employeeData?.position_name}
                    week={week}
                />
                <div className="table-container" ref={tableRef}>
                    <div className="table-scroll-wrapper">
                        <Table className="full-schedule-table" bordered>
                            <thead>
                            <tr>
                                <th className="shift-header-cell sticky-column">{t('employee.schedule.shift')}</th>
                                {days.map(day => {
                                    const dateObj = parseISO(day.date);
                                    const isToday = new Date().toDateString() === dateObj.toDateString();
                                    return (
                                        <th key={day.date} className={`day-header-cell ${isToday ? 'today-column' : ''}`}>
                                            <div className="day-name">{getDayName(dateObj.getDay(), t)}</div>
                                            {isToday ? (
                                                <Badge bg="primary" className="today-badge mt-1">{formatHeaderDate(dateObj)}</Badge>
                                            ) : (
                                                <div className="day-date">{formatHeaderDate(dateObj)}</div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {shifts.map(shift => (
                                <tr key={shift.id}>
                                    <td className="shift-info-cell sticky-column">
                                        <div
                                            className="shift-header-info"
                                            style={{
                                                backgroundColor: getShiftColor({...shift, shift_id: shift.id}),
                                                color: getContrastTextColor(getShiftColor({...shift, shift_id: shift.id}))
                                            }}
                                        >
                                            <span className="shift-header-name">{shift.shift_name}</span>
                                            <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.duration)}</span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="color-picker-btn p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openColorPicker(shift.id, getShiftColor({...shift, shift_id: shift.id}), shift);
                                                }}
                                                title={t('shift.editColor')}
                                            >
                                                <i className="bi bi-palette"></i>
                                            </Button>
                                        </div>
                                    </td>
                                    {days.map(day => {
                                        const dayShift = day.shifts.find(s => s.shift_id === shift.id);
                                        const employees = dayShift?.employees || [];
                                        return (
                                            <td key={`${day.date}-${shift.id}`} className="employee-cell">
                                                {renderShiftCell(shift, employees, () => handleNameDisplayToggle(!showFullName))}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="full-schedule-content">
            {currentWeekData && renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))}
            {nextWeekData && renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))}
        </div>
    );
};

export default FullScheduleView;