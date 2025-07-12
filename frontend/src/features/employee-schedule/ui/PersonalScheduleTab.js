// frontend/src/features/employee-schedule/ui/PersonalScheduleTab.js
import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Card } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import { scheduleAPI } from 'shared/api/apiService';
import { formatShiftTime, getDayName, formatHeaderDate } from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';
import { parseISO, addWeeks, format } from 'date-fns';
import {ScheduleHeaderCard, WeekSelector} from "./";
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import './PersonalScheduleTab.css';

const PersonalScheduleTab = () => {
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [nextWeekData, setNextWeekData] = useState(null);
    const [activeWeek, setActiveWeek] = useState('current');
    const [employeeInfo, setEmployeeInfo] = useState(null);
    const {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        currentTheme,
        hasLocalColor,
        resetShiftColor,
    } = useShiftColor();

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching current week schedule...');
            const currentData = await scheduleAPI.fetchWeeklySchedule();
            console.log('Current week data received:', currentData);

            if (currentData) {
                setCurrentWeekData(currentData);

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

    const renderWeekSchedule = (weekData) => {
        if (!weekData) return null;

        const employee = employeeInfo || weekData.employee;
        const hasSchedule = weekData.schedule && weekData.schedule.length > 0;

        return (
            <>
                {/* Header Card - similar to FullScheduleTab */}
                <ScheduleHeaderCard
                    position={employee?.position_name}
                    site={employee?.site_name}
                    empName={employee?.name}
                    week={weekData.week}
                />

                {/* Schedule Content */}
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
                                        borderColor: bgColor
                                    } : {}}
                                >
                                    <Card.Body className="py-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="day-info" style={{ color: textColor }}>
                                                <span className="day-date ">
                                                    {formatHeaderDate(dateObj)}
                                                </span>
                                                <strong className="day-name ms-2">
                                                    {getDayName(day.day_of_week ?? dateObj.getDay(), t)}
                                                </strong>
                                                {isToday && (
                                                    <Badge bg="primary" className="ms-2 today-badge">
                                                        {t('common.today')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="shift-info text-end" style={{ color: textColor }}>
                                                {userAssignment ? (
                                                    <>
                                                        <div className="shift-name fw-bold">
                                                            {userAssignment.shift_name}
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="color-picker-btn p-0 ms-2"
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
                                                    <div className="day-off d-flex align-items-center" style={{ color: 'inherit' }}>
                                                        {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
                                                        {t('employee.schedule.dayOff')}
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="color-picker-btn p-0 ms-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();

                                                                // 1. Создаем "фальшивый" объект смены для выходного
                                                                const dayOffShift = {
                                                                    shift_id: 'day_off', // Наш специальный ключ
                                                                    shift_name: t('employee.schedule.dayOff') // Название для заголовка модала
                                                                };

                                                                // 2. Вызываем openColorPicker
                                                                openColorPicker(
                                                                    dayOffShift.shift_id,
                                                                    getShiftColor(dayOffShift), // Получаем текущий цвет для выходного
                                                                    dayOffShift // Передаем сам объект
                                                                );
                                                            }}
                                                            title={t('employee.schedule.editDayOffColor')} // Новый текст для title
                                                        >
                                                            <i className="bi bi-house-door"></i>
                                                        </Button>

                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {userAssignment && !employee?.position_id && (
                                            <div className="mt-1 small">
                                                <i className="bi bi-geo-alt me-1"></i>
                                                {userAssignment.employee_info?.position || '-'}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            );
                        })}
                        <ColorPickerModal
                            show={colorPickerState.show}
                            onHide={closeColorPicker}
                            onColorSelect={applyColor}
                            onColorChange={previewColor}
                            initialColor={colorPickerState.currentColor}
                            title={t('modal.colorPicker.title')}
                            saveMode={colorPickerState.saveMode}
                            currentTheme={currentTheme}
                            hasLocalColor={hasLocalColor}
                            originalGlobalColor={colorPickerState.originalGlobalColor}
                            onResetColor={resetShiftColor}
                        />
                    </div>
                )}
            </>
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
            {/* Display selected week */}
            {activeWeek === 'current' && currentWeekData && (
                renderWeekSchedule(currentWeekData)
            )}

            {activeWeek === 'next' && nextWeekData && (
                renderWeekSchedule(nextWeekData)
            )}

            {/* New shared component */}
            <WeekSelector
                activeWeek={activeWeek}
                onWeekChange={setActiveWeek}
                currentWeekData={currentWeekData}
                nextWeekData={nextWeekData}
            />
        </div>

    );
};

export default PersonalScheduleTab;