// frontend/src/features/employee-constraints/index.js
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Container, Toast, ToastContainer } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import { addNotification, removeNotification } from 'app/model/notificationsSlice';

// Components
import PageHeader from 'shared/ui/components/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal';
import ConstraintActions from './ui/ConstraintActions';
import ConstraintGrid from './ui/ConstraintGrid';
import { ScheduleHeaderCard } from 'features/employee-schedule/ui/ScheduleHeaderCard';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';

// Redux actions & utils
import {
    cancelEditing,
    enableEditing,
    fetchWeeklyConstraints,
    resetConstraints,
    setCurrentMode,
    submissionInitiated,
    submitWeeklyConstraints,
    updateConstraint,
} from './model/constraintSlice';
import { fetchSystemSettings } from '../admin-system-settings/model/settingsSlice';

import { getContrastTextColor, hexToRgba } from 'shared/lib/utils/colorUtils';
import './index.css';

const ConstraintsSchedule = () => {
    const dispatch = useDispatch();
    const { t } = useI18n();
    const isMobile = useMediaQuery('(max-width: 888px)');
    const [justChangedCell, setJustChangedCell] = useState(null);
    useEffect(() => {
        if (justChangedCell) {
            const timer = setTimeout(() => {
                setJustChangedCell(null);
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [justChangedCell]);

    const [showInstructions, setShowInstructions] = useState(false);
    const [modalState, setModalState] = useState({ show: false, action: null });
    const toggleShowInstructions = () => setShowInstructions(!showInstructions);

    const modalConfig = {
        reset: {
            title: t('constraints.modals.resetTitle'),
            message: t('constraints.modals.resetMessage'),
            confirmText: t('common.reset'),
            variant: 'warning',
        },
        submit: {
            title: t('constraints.modals.submitTitle'),
            message: t('constraints.modals.submitMessage'),
            confirmText: t('common.submit'),
            variant: 'primary',
        },
    };

    const handleShowModal = (action) => setModalState({ show: true, action });
    const handleHideModal = () => setModalState({ show: false, action: null });

    const handleConfirmModal = () => {
        if (modalState.action === 'reset') {
            dispatch(resetConstraints());
            dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));
        } else if (modalState.action === 'submit') {
            dispatch(submissionInitiated());
            handleSubmit();
        }
        handleHideModal();
    };

    const {
        getShiftColor,
        openColorPicker,
        closeColorPicker,
        applyColor,
        previewColor,
        colorPickerState,
        userRole,
        currentTheme,
        hasLocalColor,
        resetShiftColor,
        shiftObject,
        originalGlobalColor,
    } = useShiftColor();


    const {
        weeklyTemplate,
        weeklyConstraints,
        submitting,
        currentMode,
        loading,
        error,
        isSubmitted,
        canEdit,
    } = useSelector(state => state.constraints);

    const { user } = useSelector(state => state.auth);
    const { systemSettings } = useSelector(state => state.settings);

    const LIMIT_ERROR_NOTIFICATION_ID = 'constraint-limit-error';


    const constraintPseudoShifts = useMemo(() => ({
        'cannot_work': {
            shift_id: 'constraint_cannot_work', // Уникальный ID для localStorage
            name: t('constraints.cannotWork'),
            color: '#dc3545', // Цвет по умолчанию
        },
        'prefer_work': {
            shift_id: 'constraint_prefer_work', // Уникальный ID для localStorage
            name: t('constraints.preferWork'),
            color: '#28a745', // Цвет по умолчанию
        },
    }), [t]);
    const customColors = useMemo(() => {
        const cannotWorkBg = getShiftColor(constraintPseudoShifts.cannot_work);
        const preferWorkBg = getShiftColor(constraintPseudoShifts.prefer_work);

        return {
            cannot_work: {
                background: cannotWorkBg,
                text: getContrastTextColor(cannotWorkBg),
            },
            prefer_work: {
                background: preferWorkBg,
                text: getContrastTextColor(preferWorkBg),
            },
        };
    }, [getShiftColor, constraintPseudoShifts.cannot_work, constraintPseudoShifts.prefer_work]);

    useEffect(() => {
        // Компонент сам отвечает за загрузку своих данных.
        // Кеш внутри thunk'а предотвратит лишние запросы.
        dispatch(fetchWeeklyConstraints());
        dispatch(fetchSystemSettings());
    }, [dispatch]);


    console.log('[LOG 4] weeklyTemplate:', { weeklyTemplate });

    // Calculate deadline info
    const deadlineInfo = useMemo(() => {
        if (systemSettings?.constraintDeadlineDay === undefined || !systemSettings?.constraintDeadlineTime) {
            return null;
        }

        const deadlineDay = systemSettings.constraintDeadlineDay || 3; // Wednesday by default
        const deadlineTime = systemSettings.constraintDeadlineTime || '18:00';

        // Get current week's deadline
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Calculate days until deadline day
        let daysUntilDeadline = deadlineDay - currentDay;
        if (daysUntilDeadline < 0) {
            daysUntilDeadline += 7; // Next week
        }

        // Create deadline date/time
        const deadlineDate = new Date(now);
        deadlineDate.setDate(now.getDate() + daysUntilDeadline);
        const [hours, minutes] = deadlineTime.split(':').map(Number);
        deadlineDate.setHours(hours, minutes, 0, 0);

        // If deadline is today but time has passed, it means next week's deadline
        if (daysUntilDeadline === 0 && now > deadlineDate) {
            deadlineDate.setDate(deadlineDate.getDate() + 7);
        }

        const isPassed = now > deadlineDate;
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][deadlineDay];

        return {
            day: t(`days.${dayName.toLowerCase()}`),
            time: deadlineTime,
            isPassed,
            dateTime: deadlineDate,
        };
    }, [systemSettings, t]);

    const usedCounts = useMemo(() => {
        const counts = { cannot_work: 0, prefer_work: 0 };
        if (!weeklyConstraints) return counts;

        const dayHasStatus = (day, status) => Object.values(day.shifts).some(s => s === status);

        const selectedDays = { cannot_work: new Set(), prefer_work: new Set() };

        for (const date in weeklyConstraints) {
            const dayData = weeklyConstraints[date];
            if (dayHasStatus(dayData, 'cannot_work')) {
                selectedDays.cannot_work.add(date);
            }
            if (dayHasStatus(dayData, 'prefer_work')) {
                selectedDays.prefer_work.add(date);
            }
        }

        counts.cannot_work = selectedDays.cannot_work.size;
        counts.prefer_work = selectedDays.prefer_work.size;

        return counts;
    }, [weeklyConstraints]);

    const uniqueShifts = useMemo(() => {
        if (!weeklyTemplate) return [];
        const shiftsMap = new Map();
        weeklyTemplate.constraints.template.flatMap(day => day.shifts).forEach(shift => {
            if (!shiftsMap.has(shift.shift_id)) {
                shiftsMap.set(shift.shift_id, shift);
            }
        });
        return Array.from(shiftsMap.values());
    }, [weeklyTemplate]);


    const checkLimits = (testConstraints, mode) => {
        const dayCount = Object.values(testConstraints).filter(day =>
            Object.values(day.shifts).some(status => status === mode),
        ).length;

        const maxCannotWorkDays = systemSettings?.maxCannotWorkDays || weeklyTemplate?.constraints?.limits?.cannot_work_days || 2;
        const maxPreferWorkDays = systemSettings?.maxPreferWorkDays || weeklyTemplate?.constraints?.limits?.prefer_work_days || 5;

        if (mode === 'cannot_work' && dayCount > maxCannotWorkDays) {
            return t('constraints.errors.maxCannotWork', { max: maxCannotWorkDays });
        }
        if (mode === 'prefer_work' && dayCount > maxPreferWorkDays) {
            return t('constraints.errors.maxPreferWork', { max: maxPreferWorkDays });
        }
        return null;
    };
    const triggerHapticFeedback = () => {
        try {
            // Проверяем наличие API и его тип (вдруг кто-то подменил)
            if (window.navigator && typeof window.navigator.vibrate === 'function') {
                window.navigator.vibrate(50);
            }
        } catch (e) {
            // Если что-то пошло не так (например, из-за настроек безопасности),
            // просто игнорируем ошибку, чтобы не сломать приложение.
            console.log('Haptic feedback failed, but it\'s okay.', e);
        }
    };
    const handleCellClick = (date, shiftId) => {
        triggerHapticFeedback();

        if (!canEdit || isSubmitted || deadlineInfo?.isPassed) return;

        const cellIdentifier = `${date}-${shiftId || 'day'}`;
        setJustChangedCell(cellIdentifier);

        dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));

        const currentStatus = shiftId ? (weeklyConstraints[date]?.shifts[shiftId] || 'neutral') : (weeklyConstraints[date]?.day_status || 'neutral');
        const newStatus = (currentStatus === currentMode) ? 'neutral' : currentMode;
        const testConstraints = JSON.parse(JSON.stringify(weeklyConstraints));
        if (!testConstraints[date]) {
            testConstraints[date] = { day_status: 'neutral', shifts: {} };
        }
        if (shiftId) {
            testConstraints[date].shifts[shiftId] = newStatus;
        } else {
            weeklyTemplate.constraints.template.find(d => d.date === date)?.shifts.forEach(shift => {
                testConstraints[date].shifts[shift.shift_id] = newStatus;
            });
        }
        if (newStatus !== 'neutral') {
            const limitError = checkLimits(testConstraints, newStatus);
            if (limitError) {
                dispatch(addNotification({
                    id: LIMIT_ERROR_NOTIFICATION_ID,
                    message: limitError,
                    variant: 'warning',
                    duration: 4000,
                }));
                return;
            }
        }
        dispatch(updateConstraint({ date, shiftId, status: newStatus }));
    };

    const handleSubmit = () => {
        const formattedConstraints = Object.entries(weeklyConstraints).flatMap(([date, dayData]) =>
            Object.entries(dayData.shifts)
                .filter(([, status]) => status !== 'neutral')
                .map(([shiftId, status]) => ({
                    emp_id: user.id,
                    constraint_type: status,
                    target_date: date,
                    applies_to: 'specific_date',
                    shift_id: shiftId,
                })),
        );
        dispatch(submitWeeklyConstraints({ constraints: formattedConstraints, week_start: weeklyTemplate.weekStart }));
    };

    const getCellStyles = (date, shiftId) => {
        const status = weeklyConstraints[date]?.shifts[shiftId] || 'neutral';
        const shift = uniqueShifts.find(s => s.shift_id === shiftId);
        const nextStatus = (status === currentMode) ? 'neutral' : currentMode;

        // --- Фоны и цвета (ваша логика) ---
        const neutralBgAlpha = currentTheme === 'dark' ? 0.05 : 0.5;
        const tdStyle = {
            backgroundColor: hexToRgba(shift ? getShiftColor(shift) : '#6c757d', neutralBgAlpha),
        };
        const isClickable = canEdit && !isSubmitted && !deadlineInfo?.isPassed;
        let foregroundClasses = `constraint-cell ${status} ${isClickable ? 'clickable' : ''}`;

        if (deadlineInfo?.isPassed) {
            foregroundClasses += ' deadline-passed';
        }
        const foregroundStyle = {};
        if (status !== 'neutral') {
            foregroundStyle.backgroundColor = getShiftColor(constraintPseudoShifts[status]);
            foregroundStyle.color = getContrastTextColor(foregroundStyle.backgroundColor);
        }
        let solidHoverColor;
        if (nextStatus === 'neutral') {
            solidHoverColor = shift ? getShiftColor(shift) : '#6c757d';
        } else {
            solidHoverColor = getShiftColor(constraintPseudoShifts[nextStatus]);
        }
        foregroundStyle['--cell-hover-color'] = hexToRgba(solidHoverColor, nextStatus !== 'neutral' ? 0.7 : 0.1);

        // Возвращаем всё, что нужно для рендеринга, включая nextStatus
        return {
            tdStyle,
            foregroundStyle,
            foregroundClasses,
            nextStatus, // <<< ВОЗВРАЩАЕМ nextStatus ДЛЯ DATA-АТРИБУТА
        };
    };


    const getDayHeaderClass = (date) => {
        const status = weeklyConstraints[date]?.day_status || 'neutral';
        const isClickable = canEdit && !isSubmitted && !deadlineInfo?.isPassed;
        let classes = `day-header ${status} ${isClickable ? 'clickable' : ''}`;

        if (deadlineInfo?.isPassed) {
            classes += ' deadline-passed';
        }

        return classes;
    };

    const getShiftHeaderStyle = (shift) => {
        const baseColor = getShiftColor(shift);
        return { backgroundColor: baseColor, color: getContrastTextColor(baseColor) };
    };
    // Вычисляет стиль для всей ячейки-заголовка (<th> или <td>)
    const getShiftHeaderCellStyle = (shift) => {
        const neutralBgAlpha = currentTheme === 'dark' ? 0.1 : 0.5;
        const baseColor = getShiftColor(shift);
        return {
            backgroundColor: hexToRgba(baseColor, neutralBgAlpha),
        };
    };

    if (loading) return <LoadingState />;
    if (error) return <Container className="mt-4"><PageHeader title={t('constraints.title')} /><ErrorMessage
        error={error} /></Container>;
    if (!weeklyTemplate) return <Container className="mt-4"><PageHeader title={t('constraints.title')} /><ErrorMessage
        error={t('constraints.noTemplate')} variant="info" /></Container>;


    const limitParams = {
        cannotWork: systemSettings?.maxCannotWorkDays || weeklyTemplate?.constraints?.limits?.cannot_work_days || 2,
        preferWork: systemSettings?.maxPreferWorkDays || weeklyTemplate?.constraints?.limits?.prefer_work_days || 5,
    };

    return (
        <Container fluid className="employee-constraints-container position-relative">
            <PageHeader
                icon="shield-fill-check"
                title={t('constraints.title')}
                subtitle={t('constraints.subtitle')}
            />

            {deadlineInfo && (
                <Card className="mb-2 deadline-info-card">
                    <Card.Body className="py-2">
                        <div className="d-flex align-items-center">
                            <i className={`bi ${deadlineInfo.isPassed ? 'bi-exclamation-triangle-fill text-warning' : 'bi-info-circle-fill text-info'} me-2`}></i>
                            <small className={deadlineInfo.isPassed ? 'text-warning' : 'text-muted'}>
                                {deadlineInfo.isPassed
                                    ? t('constraints.deadline.passed')
                                    : t('constraints.deadline.info', { day: deadlineInfo.day, time: deadlineInfo.time })
                                }
                            </small>
                        </div>
                    </Card.Body>
                </Card>
            )}

            <Card className="p-0 mb-2 mb-md-3 constrains-card">
                <ScheduleHeaderCard
                    className="mb-1"
                    title={t('schedule.nextWeek')}
                    week={weeklyTemplate.weekStart}
                />
                <ConstraintGrid
                    template={weeklyTemplate.constraints.template}
                    uniqueShifts={uniqueShifts}
                    onCellClick={handleCellClick}
                    getCellStyles={getCellStyles}
                    getDayHeaderClass={getDayHeaderClass}
                    getShiftHeaderStyle={getShiftHeaderStyle}
                    getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                    isMobile={isMobile}
                    justChangedCell={justChangedCell}
                    usedCounts={usedCounts}
                    limitParams={limitParams}
                    onShowInstructions={toggleShowInstructions}
                />
            </Card>
            <ToastContainer className="p-3 toast-container" style={{ zIndex: 1056 }}>
                <Toast show={showInstructions} onClose={toggleShowInstructions} autohide delay={5000}>
                    <Toast.Header closeButton={true}>
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <strong className="me-auto">{t('constraints.instructions.title')}</strong>
                    </Toast.Header>
                    <Toast.Body>
                        <ul className="mb-0 ps-3">
                            <li>{t('constraints.instructions.selectMode')}</li>
                            <li>{t('constraints.instructions.clickCells')}</li>
                            {weeklyTemplate && (
                                <li>{t('constraints.instructions.limits', limitParams)}</li>
                            )}
                        </ul>
                    </Toast.Body>
                </Toast>
            </ToastContainer>
            <ConstraintActions
                currentMode={currentMode}
                onModeChange={(mode) => dispatch(setCurrentMode(mode))}
                isSubmitted={isSubmitted}
                deadlinePassed={deadlineInfo?.isPassed}
                onColorButtonClick={(mode) => {
                    const pseudoShift = constraintPseudoShifts[mode];
                    if (!pseudoShift) return;
                    const currentColor = getShiftColor(pseudoShift);
                    // 'local' - режим сохранения, т.к. эти цвета индивидуальны для пользователя
                    openColorPicker(pseudoShift.shift_id, currentColor, pseudoShift);
                }}

                onEdit={() => dispatch(enableEditing())}
                onSubmit={() => handleShowModal('submit')}
                onClear={() => handleShowModal('reset')}
                onCancel={() => dispatch(cancelEditing())}
                customColors={customColors}
                isMobile={isMobile}

            />


            {colorPickerState.show && (
                <ColorPickerModal
                    show={colorPickerState.show}
                    onHide={closeColorPicker}
                    onColorSelect={(color) => {
                        applyColor(color, 'local');
                        closeColorPicker();
                    }}
                    onColorChange={previewColor}
                    initialColor={colorPickerState.currentColor}
                    title={t(`constraints.${currentMode}_color`)}
                    saveMode={colorPickerState.saveMode}
                    currentTheme={currentTheme}
                    hasLocalColor={hasLocalColor}
                    onResetColor={resetShiftColor}
                    shiftObject={shiftObject}
                    userRole={userRole}
                    originalGlobalColor={originalGlobalColor}
                />

            )}
            <ConfirmationModal
                show={modalState.show}
                onHide={handleHideModal}
                onConfirm={handleConfirmModal}
                loading={submitting}
                title={modalConfig[modalState.action]?.title}
                message={modalConfig[modalState.action]?.message}
                confirmText={modalConfig[modalState.action]?.confirmText}
                variant={modalConfig[modalState.action]?.variant}
            />
        </Container>
    );
};

export default ConstraintsSchedule;