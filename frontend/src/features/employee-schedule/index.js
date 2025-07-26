// frontend/src/features/employee-schedule/index.js
import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container, Form, Alert, Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import { fetchPositionSchedule } from 'features/employee-dashboard/model/employeeDataSlice';import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
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
    const dispatch = useDispatch();


    // Состояние для переключателя
    const [showFullSchedule, setShowFullSchedule] = useState(() => {
        const saved = localStorage.getItem('employee_showFullSchedule');
        return saved !== null ? JSON.parse(saved) : false;
    });

    // --- Получаем все данные из Redux ---
    const {
        personalSchedule,
        personalScheduleLoading,
        personalScheduleError,
        positionSchedule,
        positionScheduleLoading,
        positionScheduleError,
    } = useSelector(state => state.employeeData);


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

        // Если пользователь включил полное расписание и у него есть должность
        if (showFullSchedule && personalSchedule?.current?.employee?.position_id) {
            const positionId = personalSchedule.current.employee.position_id;
            // Загружаем данные для должности (они кешируются отдельно)
            dispatch(fetchPositionSchedule({ positionId }));
        }
        // Загрузку персонального расписания мы отсюда ПОЛНОСТЬЮ УБРАЛИ

    }, [dispatch, showFullSchedule, personalSchedule]);

    const isLoading = showFullSchedule ? positionScheduleLoading : personalScheduleLoading;
    const error = showFullSchedule ? positionScheduleError : personalScheduleError;
    const scheduleData = showFullSchedule ? positionSchedule : personalSchedule;

    const employeeInfo = personalSchedule?.current?.employee;
    const hasAssignedPosition = employeeInfo?.position_id || false;

    const hasDataForView = (data) => {
        if (!data?.current) return false;
        if (showFullSchedule) {
            return data.current.days && data.current.days.length > 0;
        }
        return data.current.schedule && data.current.schedule.length > 0;
    };
    const hasAnyData = hasDataForView(scheduleData);


    // --- Условный рендеринг ---
    const renderContent = () => {
        if (isLoading && !scheduleData) {
            return <LoadingState message={t('common.loading')} />;
        }
        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }
        if (showFullSchedule && !hasAssignedPosition) {
            return <EmptyState title={t('employee.schedule.positionRequired')} />;
        }
        if (!hasAnyData) {
            return <EmptyState title={t('employee.schedule.noSchedule')} />;
        }

        if (showFullSchedule) {
            return (
                <FullScheduleView
                    user={user}
                    scheduleData={scheduleData}
                    employeeData={employeeInfo}
                    getShiftColor={getShiftColor}
                    openColorPicker={openColorPicker}
                />
            );
        }

        return (
            <PersonalScheduleView
                scheduleData={scheduleData}
                employeeInfo={employeeInfo}
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
                icon="calendar-week-fill"
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