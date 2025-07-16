// frontend/src/features/employee-schedule/ui/PersonalScheduleTab.js
import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container, Table, Alert, Badge, Button, Card, Row, Col} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import {scheduleAPI} from 'shared/api/apiService';
import {formatWeekRange, formatShiftTime, getDayName, formatHeaderDate} from 'shared/lib/utils/scheduleUtils';
import {getContrastTextColor} from 'shared/lib/utils/colorUtils';
import {parseISO, addWeeks, format} from 'date-fns';
import {ScheduleHeaderCard} from './ScheduleHeaderCard/ScheduleHeaderCard';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import {useShiftColor} from 'shared/hooks/useShiftColor';
import './PersonalScheduleTab.css';

const PersonalScheduleTab = () => {
    const {t} = useI18n();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [nextWeekData, setNextWeekData] = useState(null);
    const [employeeInfo, setEmployeeInfo] = useState(null);

    const {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor
    } = useShiftColor();

    useEffect(() => {
        void fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);

        try {
            const currentData = await scheduleAPI.fetchWeeklySchedule();

            if (currentData) {
                setCurrentWeekData(currentData);
                console.log('Employee data received:', currentData.employee);
                if (currentData.employee) {
                    setEmployeeInfo(currentData.employee);
                }

                if (currentData.week?.start) {
                    const nextWeekStart = addWeeks(parseISO(currentData.week.start), 1);
                    const nextWeekDateStr = format(nextWeekStart, 'yyyy-MM-dd');

                    try {
                        const nextData = await scheduleAPI.fetchWeeklySchedule(nextWeekDateStr);
                        if (nextData) {
                            setNextWeekData(nextData);
                        }
                    } catch (nextErr) {
                        console.error('Error fetching next week:', nextErr);
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

        const employee = employeeInfo || weekData.employee;
        const hasSchedule = weekData.schedule && weekData.schedule.length > 0;
        const hasPosition = employee?.position_id;
        const hasWorkSite = employee?.site_id;
        console.log('Employee Worksite Info:', employee?.site_name, employee.position_name)
        return (
            <div className="week-schedule-section mb-4">
                <ScheduleHeaderCard
                    className="position-info-card"
                    title={weekTitle}
                    empName={employee?.name}
                    site={employee?.site_name}
                    position={employee?.position_name}
                    week={weekData.week}
                />

                {!hasSchedule ? (
                    <Card className="text-center py-4">
                        <Card.Body>
                            <p className="text-muted mb-0">
                                <i className="bi bi-calendar-x me-2"></i>
                                {weekData.message || t('employee.schedule.noSchedule')}
                            </p>
                        </Card.Body>
                    </Card>
                ) : (
                    <div className="personal-schedule-list">
                        {weekData.schedule.map((day, index) => {
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
                            const bgColor = userAssignment ? getShiftColor(userAssignment) : '#f8f9fa';
                            const textColor = getContrastTextColor(bgColor);



                            return (
                                <Card
                                    key={day.date}
                                    className={`day-card mb-2 ${isToday ? 'today-card' : ''} ${!userAssignment ? 'day-off-card' : ''}`}
                                    style={userAssignment ? {
                                        backgroundColor: bgColor,
                                        color: textColor,
                                        borderColor: bgColor
                                    } : {}}
                                >
                                    <Card.Body className="py-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="day-info">
                                                {isToday ? (
                                                    <Badge bg="primary" className="today-badge">
                                                        {formatHeaderDate(dateObj)}
                                                    </Badge>
                                                ) : (
                                                    <span className="day-date ">
                                                        {formatHeaderDate(dateObj)}
                                                    </span>
                                                )}
                                                <strong className="day-name ms-2">
                                                    {getDayName(day.day_of_week ?? dateObj.getDay(), t)}
                                                </strong>

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
                                                                    openColorPicker(
                                                                        userAssignment.shift_id,
                                                                        getShiftColor(userAssignment),
                                                                        userAssignment
                                                                    );
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
                                                    <div className="day-off">
                                                        {t('employee.schedule.dayOff')}
                                                        <i className="bi bi-house-door ms-1"></i>
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                        {/* Показываем позицию и сайт если работник не привязан к позиции */}
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
                )}
            </div>
        );
    };

    if (loading) {
        return <LoadingState message={t('common.loading')}/>;
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

    return (
        <div className="personal-schedule-content">
            {currentWeekData && renderWeekSchedule(currentWeekData, t('employee.schedule.currentWeek'))}
            {nextWeekData && renderWeekSchedule(nextWeekData, t('employee.schedule.nextWeek'))}

            <ColorPickerModal
                show={colorPickerState.show}
                onHide={closeColorPicker}
                onColorSelect={applyColor}
                onColorChange={previewColor}
                initialColor={colorPickerState.currentColor}
                title={t('modal.colorPicker.title')}
                saveMode={colorPickerState.saveMode}
                currentTheme={colorPickerState.currentTheme}
                hasLocalColor={colorPickerState.hasLocalColor}
                originalGlobalColor={colorPickerState.originalGlobalColor}
            />
        </div>
    );
};

export default PersonalScheduleTab;