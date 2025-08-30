// frontend/src/features/employee-schedule/ui/FullScheduleView/index.js
import React, { useRef, useState } from 'react';
import { Badge, Button, Card, Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    formatEmployeeName,
    formatShiftTime,
    formatTableHeaderDate,
    getDayName,
} from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';
import { parseISO } from 'date-fns';
import { ScheduleHeaderCard } from '../ScheduleHeaderCard';
import './FullScheduleView.css';

const FullScheduleView = ({
                              user,
                              scheduleData,
                              employeeData,
                              getShiftColor,
                              openColorPicker,
                              showCurrentWeek,
                              showNextWeek,
                          }) => {
    const { t } = useI18n();
    const tableRef = useRef(null);

    // Get theme for contrast calculation
    const currentTheme = localStorage.getItem('theme') || 'light';
    const isDark = currentTheme === 'dark';

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
            emp.is_current_user || emp.emp_id === employeeData?.emp_id || emp.emp_id === user?.id,
        );

        // Create proper shift object for color
        const shiftObj = {
            shift_id: shift.id || shift.shift_id,
            shift_name: shift.shift_name,
            color: shift.color,
        };

        const bgColor = getShiftColor(shiftObj) || '#6c757d';
        const textColor = getContrastTextColor(bgColor, isDark);

        return (
            <div
                className={`shift-cell ${hasCurrentUser ? 'current-user-shift' : ''}`}
                style={{ backgroundColor: bgColor, color: textColor }}
                onClick={onNameClick}
                title={t('employee.schedule.toggleNameFormatHint')}
            >
                <div className="shift-employees">
                    {employees.length > 0 ? (
                        employees.map((emp) => {
                            const [firstName, ...lastNameParts] = emp.name.split(' ');
                            const lastName = lastNameParts.join(' ');
                            const isCurrentUser = emp.is_current_user || emp.emp_id === employeeData?.emp_id;

                            return (
                                <div
                                    key={emp.emp_id}
                                    className={`employee-name ${isCurrentUser ? 'fw-bold' : ''}`}
                                    style={{ color: textColor }}
                                >
                                    {formatEmployeeName(firstName, lastName, showFullName)}
                                    {/* Show site name if it's cross-site assignment */}
                                    {emp.is_cross_site && emp.site_name && (
                                        <span className="small ms-1" style={{ opacity: 0.8 }}>
                                            <i className="bi bi-building"></i> {emp.site_name}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-shift text-muted">-</div>
                    )}
                </div>
            </div>
        );
    };

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData || !weekData.days || weekData.days.length === 0) return null;

        const { days, shifts, position, week } = weekData;
        days.map(d => parseISO(d.date));
        const todayStr = new Date().toISOString().split('T')[0];

        return (
            <Card className="week-schedule-section mb-4">
                <ScheduleHeaderCard
                    className="mb-1"
                    title={weekTitle}
                    empName={employeeData?.name}
                    site={position?.site_name}
                    position={position?.name}
                    week={week}
                    additionalInfo={position?.has_cross_site_assignments ?
                        `${t('schedule.includingCrossSite')}: ${position.sites_involved?.join(', ')}` : null}
                />
                <div className="table-container">
                    <div ref={tableRef} className="table-scroll-wrapper">
                        <Table className="full-schedule-table" responsive bordered>
                            <thead>
                            <tr>
                                <th className="shift-header-cell sticky-column">
                                    {t('employee.schedule.shift')}
                                </th>
                                {days.map((day, index) => {
                                    const dateObj = parseISO(day.date);
                                    const isToday = day.date === todayStr;
                                    return (
                                        <th key={day.date}
                                            className={`day-header-cell ${isToday ? 'today-column' : ''}`}>
                                            <div className="day-name">{getDayName(dateObj.getDay(), t)}</div>
                                            {isToday ? (
                                                <Badge bg="primary"
                                                       className="today-badge mt-1">{formatTableHeaderDate(dateObj)}</Badge>
                                            ) : (
                                                <div className="day-date">{formatTableHeaderDate(dateObj)}</div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {shifts.map(shift => {
                                const shiftId = shift.id || shift.shift_id;
                                const shiftDuration = shift.duration || shift.duration_hours;

                                // Create proper shift object
                                const shiftObj = {
                                    shift_id: shiftId,
                                    shift_name: shift.shift_name,
                                    color: shift.color,
                                };

                                const bgColor = getShiftColor(shiftObj) || '#6c757d';
                                const textColor = getContrastTextColor(bgColor, isDark);

                                return (
                                    <tr key={shiftId}>
                                        <td className="shift-info-cell sticky-column">
                                            <div
                                                className="shift-header-info"
                                                style={{
                                                    backgroundColor: bgColor,
                                                    color: textColor,
                                                }}
                                            >
                                                <span className="shift-header-name">{shift.shift_name}</span>
                                                <span className="shift-header-time">
                                                    {formatShiftTime(shift.start_time, shiftDuration)}
                                                </span>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="color-picker-btn p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openColorPicker(shiftId, bgColor, shiftObj);
                                                    }}
                                                    title={t('shift.editColor')}
                                                    style={{ color: textColor }}
                                                >
                                                    <i className="bi bi-palette"></i>
                                                </Button>
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const dayShift = day.shifts.find(s => s.shift_id === shiftId);
                                            const employees = dayShift?.employees || [];
                                            return (
                                                <td key={`${day.date}-${shiftId}`} className="employee-cell">
                                                    {renderShiftCell(shiftObj, employees,
                                                        () => handleNameDisplayToggle(!showFullName))}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="full-schedule-content">
            {showCurrentWeek && renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))}
            {showNextWeek && renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))}
        </div>
    );
};

export default FullScheduleView;