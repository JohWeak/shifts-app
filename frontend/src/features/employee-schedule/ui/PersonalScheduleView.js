// frontend/src/features/employee-schedule/ui/PersonalScheduleView.js
import React from 'react';
import {Button, Card, Badge} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {formatShiftTime, getDayName, formatHeaderDate} from 'shared/lib/utils/scheduleUtils';
import {getContrastTextColor} from 'shared/lib/utils/colorUtils';
import {parseISO} from 'date-fns';
import {ScheduleHeaderCard} from './ScheduleHeaderCard/ScheduleHeaderCard';
import './PersonalScheduleView.css';

const PersonalScheduleView = ({currentWeekData, nextWeekData, employeeInfo, getShiftColor, openColorPicker}) => {
    const {t} = useI18n();

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData) return null;

        const employee = employeeInfo || weekData.employee;
        const hasSchedule = weekData.schedule && weekData.schedule.length > 0;
        const hasPosition = employee?.position_id;
        const hasWorkSite = employee?.site_id;
        if (!hasSchedule) {
            return null;
        }
        return (
            <Card className="week-schedule-section mb-4 ">
                <ScheduleHeaderCard
                    className="position-info-card mb-2"
                    title={weekTitle}
                    empName={employee?.name}
                    site={employee?.site_name}
                    position={employee?.position_name}
                    week={weekData.week}
                />
                <div className="personal-schedule-list">
                    {weekData.schedule.map((day) => {
                        let userAssignment = null;

                        if (day.shifts && Array.isArray(day.shifts)) {
                            userAssignment = day.shifts.find(shift =>
                                shift.employees?.some(e => e.is_current_user || e.emp_id === employee?.emp_id)
                            );
                            if (userAssignment) {
                                const assignedEmployee = userAssignment.employees.find(e => e.is_current_user || e.emp_id === employee?.emp_id);
                                userAssignment = {...userAssignment, employee_info: assignedEmployee};
                            }
                        }

                        const dateObj = parseISO(day.date);
                        const isToday = new Date().toDateString() === dateObj.toDateString();
                        const bgColor = userAssignment ? getShiftColor(userAssignment) : '#f8f9fa';
                        const textColor = getContrastTextColor(bgColor);

                        return (
                            <Card
                                key={day.date}
                                className={`day-card mx-2 mb-2 ${isToday ? 'today-card' : ''} ${!userAssignment ? 'day-off-card' : ''}`}
                                style={userAssignment ? {
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    borderColor: bgColor
                                } : {}}
                            >
                                <Card.Body className="py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="day-info">
                                            <span className="day-date">{formatHeaderDate(dateObj)}</span>
                                            <strong
                                                className="day-name ms-2">{getDayName(day.day_of_week ?? dateObj.getDay(), t)}</strong>
                                            {isToday && <Badge bg="primary"
                                                               className="today-badge ms-1 small">{t('common.today')}</Badge>}
                                        </div>
                                        <div className="shift-info text-end">
                                            {userAssignment ? (
                                                <>
                                                    <div className="shift-name fw-bold">
                                                        {userAssignment.shift_name}
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="color-picker-btn p-0 ms-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openColorPicker(userAssignment.shift_id, getShiftColor(userAssignment), userAssignment);
                                                            }}
                                                            title={t('shift.editColor')}
                                                        >
                                                            <i className="bi bi-palette"></i>
                                                        </Button>
                                                    </div>
                                                    <div className="shift-time small">
                                                        {formatShiftTime(userAssignment.start_time, userAssignment.duration)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="day-off text-muted">
                                                    {t('employee.schedule.dayOff')}
                                                    <i className="bi bi-house-door ms-1"></i>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {userAssignment && (!hasPosition || !hasWorkSite) && (
                                        <div className="mt-2 pt-2 border-top small d-flex justify-content-between">
                                            {userAssignment.employee_info?.position && (
                                                <div className="me-1">
                                                    <i className="bi bi-person-badge me-1"></i>
                                                    {userAssignment.employee_info.position}
                                                </div>
                                            )}
                                            {userAssignment.employee_info?.site_name && (
                                                <div className="ms-1">
                                                    <i className="bi bi-building me-1"></i>
                                                    {userAssignment.employee_info.site_name}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>
            </Card>
        );
    };

    return (
        <div className="personal-schedule-content">
            {currentWeekData && renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))}
            {nextWeekData && renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))}
        </div>
    );
};

export default PersonalScheduleView;