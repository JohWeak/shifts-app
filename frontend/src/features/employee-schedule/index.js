// frontend/src/features/employee-schedule/index.js
import React, {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {Container, Form, Alert, Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {parseISO, addWeeks, format} from 'date-fns';

import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import PersonalScheduleView from './ui/PersonalScheduleView';
import FullScheduleView from './ui/FullScheduleView';

import {scheduleAPI} from 'shared/api/apiService';
import {useShiftColor} from 'shared/hooks/useShiftColor';

import './index.css';

const EmployeeSchedule = () => {
    const {t, direction} = useI18n();
    const {user} = useSelector(state => state.auth);

    // --- Централизованное состояние ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [nextWeekData, setNextWeekData] = useState(null);
    const [employeeData, setEmployeeData] = useState(null);

    // Состояние для переключателя
    const [showFullSchedule, setShowFullSchedule] = useState(() => {
        const saved = localStorage.getItem('employee_showFullSchedule');
        return saved !== null ? JSON.parse(saved) : false;
    });

    // Централизованный хук для управления цветами
    const {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        currentTheme,
        hasLocalColor,
        resetShiftColor
    } = useShiftColor();

    useEffect(() => {
        localStorage.setItem('employee_showFullSchedule', JSON.stringify(showFullSchedule));
        void fetchSchedules(); // void используется, чтобы показать, что мы намеренно не ждем промис
    }, [showFullSchedule]);

    const fetchSchedules = async () => {
        setLoading(true);
        setError(null);
        setCurrentWeekData(null);
        setNextWeekData(null);

        try {
            // Получаем базовые данные о сотруднике
            const initialResponse = await scheduleAPI.fetchWeeklySchedule();
            const initialData = initialResponse.data || initialResponse;

            if (initialData?.employee) {
                setEmployeeData(initialData.employee);
            }

            if (showFullSchedule && initialData?.employee?.position_id) {
                // --- Логика для полного расписания
                const positionId = initialData.employee.position_id;

                // Загрузка текущей недели
                const currentData = await scheduleAPI.fetchPositionWeeklySchedule(positionId);
                if (currentData?.success) {
                    setCurrentWeekData(currentData);
                }

                // Загрузка следующей недели
                if (currentData?.week?.start) {
                    const nextWeekStart = format(addWeeks(parseISO(currentData.week.start), 1), 'yyyy-MM-dd');
                    const nextData = await scheduleAPI.fetchPositionWeeklySchedule(positionId, nextWeekStart);
                    if (nextData?.success) {
                        setNextWeekData(nextData);
                    }
                }
            } else {
                // --- Логика для персонального расписания ---
                setCurrentWeekData(initialData);
                if (initialData?.week?.start) {
                    const nextWeekStart = format(addWeeks(parseISO(initialData.week.start), 1), 'yyyy-MM-dd');
                    const nextResponse = await scheduleAPI.fetchWeeklySchedule(nextWeekStart);
                    const nextData = nextResponse.data || nextResponse;
                    if (nextData) {
                        setNextWeekData(nextData);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching schedule data:', err);
            const errorMessage = err.response?.data?.message || err.message || t('errors.fetchFailed');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const hasAssignedPosition = employeeData?.position_id || false;
    const hasAnyData = !!(currentWeekData?.schedule || currentWeekData?.days);


    // --- Условный рендеринг ---
    const renderContent = () => {
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

        if (showFullSchedule && !hasAssignedPosition) {
            return (
                <EmptyState
                    icon={<i className="bi bi-person-x display-1"></i>}
                    title={t('employee.schedule.positionRequired')}
                    description={t('employee.schedule.positionRequiredDesc')}
                />
            );
        }

        if (!hasAnyData) {
            return (
                <EmptyState
                    icon={<i className="bi bi-calendar-x display-1"></i>}
                    title={t('employee.schedule.noSchedule')}
                    description={t('employee.schedule.noScheduleDesc')}
                />
            );
        }

        if (showFullSchedule && hasAssignedPosition) {
            return (
                <FullScheduleView
                    user={user}
                    currentWeekData={currentWeekData}
                    nextWeekData={nextWeekData}
                    employeeData={employeeData}
                    getShiftColor={getShiftColor}
                    openColorPicker={openColorPicker}
                />
            );
        }

        return (
            <PersonalScheduleView
                currentWeekData={currentWeekData}
                nextWeekData={nextWeekData}
                employeeInfo={employeeData}
                getShiftColor={getShiftColor}
                openColorPicker={openColorPicker}
            />
        );
    };

    const headerActions = hasAssignedPosition ? (
        <Form.Check
            type="switch"
            id="full-schedule-toggle"
            label={t('employee.schedule.fullView')}
            checked={showFullSchedule}
            onChange={(e) => setShowFullSchedule(e.target.checked)}
            className="full-schedule-toggle"
            reverse={direction === 'ltr'}
        />
    ) : null;

    return (
        <Container fluid className="employee-schedule-container">
            <PageHeader
                icon="calendar-week"
                title={t('employee.schedule.title')}
                subtitle={t('employee.schedule.subtitle')}
                actions={headerActions}
            />

            {renderContent()}

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
        </Container>
    );
};

export default EmployeeSchedule;