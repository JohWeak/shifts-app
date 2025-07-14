// frontend/src/features/employee-schedule/ui/FullScheduleTab.js
import React, {useState, useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
import {Table, Alert, Card, Badge, Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import api from 'shared/api';
import {scheduleAPI} from 'shared/api/apiService';
import {formatWeekRange, formatShiftTime, getDayName, formatHeaderDate} from 'shared/lib/utils/scheduleUtils';
import {getContrastTextColor} from 'shared/lib/utils/colorUtils';
import {parseISO, addWeeks, format} from 'date-fns';
import {useShiftColor} from 'shared/hooks/useShiftColor';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import {formatEmployeeName} from 'shared/lib/utils/scheduleUtils';
import {ScheduleHeaderCard, WeekSelector} from './';
import './FullScheduleTab.css';

const FullScheduleTab = () => {
    const {t} = useI18n();
    const {user} = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [nextWeekData, setNextWeekData] = useState(null);
    const [activeWeek, setActiveWeek] = useState('current');
    const [employeeData, setEmployeeData] = useState(null);
    const tableRef = useRef(null);
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
        void fetchEmployeeData();
    }, []);

    const [showFullName, setShowFullName] = useState(() => {
        const saved = localStorage.getItem('employee_showFullName'); // Новый ключ
        return saved !== null ? JSON.parse(saved) : false; // По умолчанию выключено (false)
    });
    const handleNameDisplayToggle = (checked) => {
        setShowFullName(checked);
        localStorage.setItem('employee_showFullName', JSON.stringify(checked)); // Новый ключ
    };

    const fetchEmployeeData = async () => {
        try {
            console.log('Fetching employee data...');
            const data = await scheduleAPI.fetchWeeklySchedule();
            console.log('Employee data received:', data);

            if (data?.employee) {
                setEmployeeData(data.employee);

                if (data.employee.position_id) {
                    // Загружаем текущую неделю
                    await fetchFullSchedule(data.employee.position_id);

                    // Загружаем следующую неделю
                    if (data.week?.start) {
                        const nextWeekStart = addWeeks(parseISO(data.week.start), 1);
                        const nextWeekDateStr = format(nextWeekStart, 'yyyy-MM-dd');
                        await fetchFullSchedule(data.employee.position_id, nextWeekDateStr, true);
                    }
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

    const fetchFullSchedule = async (positionId, date = null, isNextWeek = false) => {
        try {
            console.log('Fetching full schedule for position:', positionId, 'date:', date);
            const params = date ? {date} : {};
            const response = await api.get(`/api/schedules/position/${positionId}/weekly`, {params});

            // Логируем полный response для отладки
            console.log('Full schedule response:', response);
            console.log('Full schedule response.data:', response.data);

            // API может возвращать данные в response или response.data
            const data = response.data || response;

            if (data?.success) {
                if (isNextWeek) {
                    setNextWeekData(data);
                    console.log('Next week data set:', data);
                } else {
                    setCurrentWeekData(data);
                    console.log('Current week data set:', data);
                }
            } else {
                console.log('No success in response:', data);
            }
        } catch (err) {
            console.error('Error fetching full schedule:', err);
            if (!isNextWeek) {
                if (err.response?.status === 404) {
                    setError(t('employee.schedule.fullScheduleNotAvailable'));
                } else {
                    setError(err.response?.data?.message || t('errors.fetchFailed'));
                }
            }
        } finally {
            if (!isNextWeek) {
                setLoading(false);
            }
        }
    };

    const renderShiftCell = (shift, employees) => {
        const hasCurrentUser = employees.some(emp =>
            emp.is_current_user || emp.emp_id === employeeData?.emp_id || emp.emp_id === user?.id
        );
        const bgColor = getShiftColor({ ...shift, shift_id: shift.id });
        const textColor = getContrastTextColor(bgColor);

        return (
            <div
                className={`shift-cell ${hasCurrentUser ? 'current-user-shift' : ''}`}
                style={{
                    backgroundColor: bgColor,
                    color: textColor
                }}
            >
                <div className="shift-employees">
                    {employees.length > 0 ? (
                        employees.map((emp, idx) => {
                            // Парсим имя и фамилию из полного имени
                            const [firstName, ...lastNameParts] = emp.name.split(' ');
                            const lastName = lastNameParts.join(' ');

                            return (
                                <div
                                    key={emp.emp_id}
                                    className={`employee-name ${
                                        emp.is_current_user || emp.emp_id === employeeData?.emp_id
                                            ? 'fw-bold'
                                            : ''
                                    }`}
                                    style={{ color: textColor }}
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

    // Функция для рендеринга расписания конкретной недели
    const renderWeekSchedule = (weekData) => {
        if (!weekData || !weekData.days || !weekData.shifts) {
            return (
                <Card className="text-center py-5">
                    <Card.Body>
                        <p className="text-muted">
                            {weekData?.message || t('employee.schedule.noSchedule')}
                        </p>
                    </Card.Body>
                </Card>
            );
        }

        const {week, position, shifts, days} = weekData;

        return (
            <>
                <ScheduleHeaderCard
                    className="position-info-card"
                    title=''
                    site={position?.site_name || employeeData?.site_name}
                    position={position?.name || employeeData?.position_name}
                    week={week}
                    showNameToggle={true}
                    showFullName={showFullName}
                    onNameToggle={handleNameDisplayToggle}
                />

                <div className="table-container" ref={tableRef}>
                    <div className="table-scroll-wrapper">
                        <Table className="full-schedule-table" bordered>
                            <thead>
                            <tr>
                                <th className="shift-header-cell sticky-column">
                                    {t('employee.schedule.shift')}
                                </th>
                                {days.map(day => {
                                    const dateObj = parseISO(day.date);
                                    const isToday = new Date().toDateString() === dateObj.toDateString();

                                    return (
                                        <th key={day.date}
                                            className={`day-header-cell ${isToday ? 'today-column' : ''}`}>
                                            <div className="day-name">
                                                {getDayName(dateObj.getDay(), t)}
                                            </div>
                                            {isToday? (
                                                <Badge bg="primary" className="today-badge mt-1">
                                                    {formatHeaderDate(dateObj)}
                                                </Badge>
                                            ) : (
                                            <div className="day-date">
                                                {formatHeaderDate(dateObj)}
                                            </div>
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
                                                backgroundColor: getShiftColor({ ...shift, shift_id: shift.id }),
                                                color: getContrastTextColor(getShiftColor({ ...shift, shift_id: shift.id }))
                                            }}
                                        >
                                            <span className="shift-header-name">{shift.shift_name}
                                            </span>
                                            <span className="shift-header-time">
                                                    {formatShiftTime(shift.start_time, shift.duration)}
                                            </span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="color-picker-btn p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openColorPicker(
                                                        shift.id,
                                                        getShiftColor({ ...shift, shift_id: shift.id }),
                                                        shift
                                                    );
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
                                                {renderShiftCell(shift, employees)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </Table>

                    </div>
                </div>
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
            </>
        );
    };

    if (loading) {
        return <LoadingState message={t('common.loading')}/>;
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
        <div className="full-schedule-content">
            {/* Display selected week */}
            {activeWeek === 'current' && currentWeekData && renderWeekSchedule(currentWeekData)}
            {activeWeek === 'next' && nextWeekData && renderWeekSchedule(nextWeekData)}


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

export default FullScheduleTab;