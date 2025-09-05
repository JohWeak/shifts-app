// frontend/src/features/employee-schedule/ui/PersonalScheduleView/index.js
import React, { useState } from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime, formatTableHeaderDate, getDayName } from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';
import { parseISO } from 'date-fns';
import { ScheduleHeaderCard } from '../ScheduleHeaderCard';
import './PersonalScheduleView.css';
import CalendarExportModal from '../CalendarExportModal';

const PersonalScheduleView = ({
                                  scheduleData,
                                  employeeInfo,
                                  getShiftColor,
                                  openColorPicker,
                                  showCurrentWeek,
                                  showNextWeek,
                              }) => {
    const { t } = useI18n();
    const currentWeekData = scheduleData?.current;
    const nextWeekData = scheduleData?.next;

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportWeekData, setExportWeekData] = useState(null);

    const handleCalendarExport = (weekData) => {
        setExportWeekData(weekData);
        setShowExportModal(true);
    };

    const renderWeekSchedule = (weekData, weekTitle) => {
        if (!weekData || !weekData.schedule) return null;

        const employee = employeeInfo || weekData.employee;
        const hasPosition = employee?.position_id;
        const hasWorkSite = employee?.site_id;

        const userHasAtLeastOneShift = weekData.schedule.some(day =>
            day.shifts?.some(shift =>
                shift.employees?.some(e => e.is_current_user || e.emp_id === employee?.emp_id),
            ),
        );
        if (!userHasAtLeastOneShift) {
            return null;
        }

        return (
            <Card className="week-schedule-section personal-schedule mb-4 ">
                <ScheduleHeaderCard
                    className="mb-2"
                    title={weekTitle}
                    empName={employee?.name}
                    site={employee?.site_name}
                    position={employee?.position_name}
                    week={weekData.week}
                    showCalendarExport={true}
                    onCalendarExport={() => handleCalendarExport(weekData)}
                />
                <div className="personal-schedule-list">
                    {weekData.schedule.map((day) => {
                        let userAssignment = null;

                        if (day.shifts && Array.isArray(day.shifts)) {
                            userAssignment = day.shifts.find(shift =>
                                shift.employees?.some(e => e.is_current_user || e.emp_id === employee?.emp_id),
                            );
                            if (userAssignment) {
                                const assignedEmployee = userAssignment.employees.find(e => e.is_current_user || e.emp_id === employee?.emp_id);
                                userAssignment = { ...userAssignment, employee_info: assignedEmployee };
                            }
                        }

                        const dateObj = parseISO(day.date);
                        const isToday = new Date().toDateString() === dateObj.toDateString();
                        const bgColor = userAssignment ? getShiftColor(userAssignment) : '#f8f9fa';
                        const textColor = getContrastTextColor(bgColor);

                        // Check if we need to show additional position/site info
                        const shouldShowPositionInfo = userAssignment && (
                            !hasPosition || // Flexible employee
                            (userAssignment.employee_info?.position &&
                                userAssignment.employee_info.position !== employee?.position_name) // Different position
                        );

                        const shouldShowSiteInfo = userAssignment && (
                            !hasWorkSite || // No default site
                            (userAssignment.employee_info?.site_name &&
                                userAssignment.employee_info.site_name !== employee?.site_name) // Different site
                        );

                        const shouldShowAdditionalInfo = shouldShowPositionInfo || shouldShowSiteInfo;

                        return (
                            <Card
                                key={day.date}
                                className={`day-card mx-2 mb-2 ${isToday ? 'today-card' : ''} ${!userAssignment ? 'day-off-card' : ''}`}
                                style={userAssignment ? {
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    borderColor: bgColor,
                                } : {}}
                            >
                                <Card.Body className="py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="day-info">
                                            <span className="day-date">{formatTableHeaderDate(dateObj)}</span>
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
                                    {shouldShowAdditionalInfo && (
                                        <div className="mt-2 pt-2 border-top small d-flex justify-content-between">
                                            {shouldShowPositionInfo && userAssignment?.employee_info?.position && (
                                                <div className="me-1">
                                                    <i className="bi bi-person-badge me-1"></i>
                                                    {userAssignment?.employee_info.position}
                                                </div>
                                            )}
                                            {shouldShowSiteInfo && userAssignment?.employee_info?.site_name && (
                                                <div className="ms-1">
                                                    <i className="bi bi-building me-1"></i>
                                                    {userAssignment?.employee_info.site_name}
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
            {showCurrentWeek && currentWeekData && renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))}
            {showNextWeek && nextWeekData && renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))}

            <CalendarExportModal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                weekSchedule={exportWeekData}
                employeeName={employeeInfo?.name || exportWeekData?.employee?.name}
            />
        </div>
    );
};

export default PersonalScheduleView;