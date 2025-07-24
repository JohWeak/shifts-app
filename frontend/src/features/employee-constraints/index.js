// frontend/src/features/employee-constraints/index.js
import React, {useState, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Card, Container, Toast, ToastContainer, Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useShiftColor} from 'shared/hooks/useShiftColor';
import {useMediaQuery} from 'shared/hooks/useMediaQuery';
import {addNotification, removeNotification} from 'app/model/notificationsSlice';

// Components
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import ConstraintActions from './ui/ConstraintActions';
import ConstraintGrid from './ui/ConstraintGrid';
import {ScheduleHeaderCard} from 'features/employee-schedule/ui/ScheduleHeaderCard/ScheduleHeaderCard';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';

// Redux actions & utils

import {
    fetchWeeklyConstraints,
    submitWeeklyConstraints,
    updateConstraint,
    setCurrentMode,
    clearSubmitStatus,
    enableEditing,
    resetConstraints,
    cancelEditing
} from './model/constraintSlice';

import {formatEmployeeName} from 'shared/lib/utils/scheduleUtils';
import {getContrastTextColor, hexToRgba} from 'shared/lib/utils/colorUtils';
import './index.css';

const ConstraintsSchedule = () => {
    const dispatch = useDispatch();
    const {t} = useI18n();
    const isMobile = useMediaQuery('(max-width: 888px)');
    const [justChangedCell, setJustChangedCell] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [modalState, setModalState] = useState({show: false, action: null});
    const toggleShowInstructions = () => setShowInstructions(!showInstructions);

    const modalConfig = {
        reset: {
            title: t('constraints.modals.resetTitle'),
            message: t('constraints.modals.resetMessage'),
            confirmText: t('common.reset'),
            variant: 'warning'
        },
        submit: {
            title: t('constraints.modals.submitTitle'),
            message: t('constraints.modals.submitMessage'),
            confirmText: t('common.submit'),
            variant: 'primary'
        }
    };

    const handleShowModal = (action) => setModalState({show: true, action});
    const handleHideModal = () => setModalState({show: false, action: null});

    const handleConfirmModal = () => {
        if (modalState.action === 'reset') {
            dispatch(resetConstraints());
            dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));
        } else if (modalState.action === 'submit') {
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
        originalGlobalColor
    } = useShiftColor();


    const {
        weeklyTemplate,
        weeklyConstraints,
        submitting,
        submitStatus,
        currentMode,
        loading,
        error,
        isSubmitted,
        canEdit
    } = useSelector(state => state.constraints);

    const {user} = useSelector(state => state.auth);

    const LIMIT_ERROR_NOTIFICATION_ID = 'constraint-limit-error';


    const constraintPseudoShifts = useMemo(() => ({
        'cannot_work': {
            shift_id: 'constraint_cannot_work', // Уникальный ID для localStorage
            name: t('constraints.cannotWork'),
            color: '#dc3545' // Цвет по умолчанию
        },
        'prefer_work': {
            shift_id: 'constraint_prefer_work', // Уникальный ID для localStorage
            name: t('constraints.preferWork'),
            color: '#28a745' // Цвет по умолчанию
        }
    }), [t]);
    const customColors = useMemo(() => {
        const cannotWorkBg = getShiftColor(constraintPseudoShifts.cannot_work);
        const preferWorkBg = getShiftColor(constraintPseudoShifts.prefer_work);

        return {
            cannot_work: {
                background: cannotWorkBg,
                text: getContrastTextColor(cannotWorkBg)
            },
            prefer_work: {
                background: preferWorkBg,
                text: getContrastTextColor(preferWorkBg)
            }
        };
    }, [getShiftColor, constraintPseudoShifts.cannot_work, constraintPseudoShifts.prefer_work]);

    useEffect(() => {
        // Компонент сам отвечает за загрузку своих данных.
        // Кеш внутри thunk'а предотвратит лишние запросы.
        dispatch(fetchWeeklyConstraints());
    }, [dispatch]);

    useEffect(() => {
        if (submitStatus === 'success') {
            dispatch(addNotification({
                id: 'constraint-submit-success',
                message: t('constraints.submitSuccess'),
                variant: 'success'
            }));
            dispatch(clearSubmitStatus());
        }
        return () => {
            dispatch(removeNotification('constraints-already-submitted'));
        };
    }, [submitStatus, dispatch, t]);
    console.log('[LOG 4] weeklyTemplate:', {weeklyTemplate});

    const usedCounts = useMemo(() => {
        const counts = {cannot_work: 0, prefer_work: 0};
        if (!weeklyConstraints) return counts;

        const dayHasStatus = (day, status) => Object.values(day.shifts).some(s => s === status);

        const selectedDays = {cannot_work: new Set(), prefer_work: new Set()};

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
            Object.values(day.shifts).some(status => status === mode)
        ).length;
        const limits = weeklyTemplate?.constraints?.limits;
        if (mode === 'cannot_work' && dayCount > limits?.cannot_work_days) {
            return t('constraints.errors.maxCannotWork', {max: limits.cannot_work_days});
        }
        if (mode === 'prefer_work' && dayCount > limits?.prefer_work_days) {
            return t('constraints.errors.maxPreferWork', {max: limits.prefer_work_days});
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
            console.log("Haptic feedback failed, but it's okay.", e);
        }
    };
    const handleCellClick = (date, shiftId) => {
        triggerHapticFeedback();

        if (!canEdit || isSubmitted) return;

        const cellIdentifier = `${date}-${shiftId || 'day'}`;
        setJustChangedCell(cellIdentifier);

        dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));

        const currentStatus = shiftId ? (weeklyConstraints[date]?.shifts[shiftId] || 'neutral') : (weeklyConstraints[date]?.day_status || 'neutral');
        const newStatus = (currentStatus === currentMode) ? 'neutral' : currentMode;
        const testConstraints = JSON.parse(JSON.stringify(weeklyConstraints));
        if (!testConstraints[date]) {
            testConstraints[date] = {day_status: 'neutral', shifts: {}};
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
                    duration: 4000
                }));
                return;
            }
        }
        dispatch(updateConstraint({date, shiftId, status: newStatus}));
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
                    shift_id: shiftId
                }))
        );
        dispatch(submitWeeklyConstraints({constraints: formattedConstraints, week_start: weeklyTemplate.weekStart}));
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
        const foregroundClasses = `constraint-cell ${status} ${canEdit && !isSubmitted ? 'clickable' : ''}`;
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
        return `day-header ${status} ${canEdit && !isSubmitted ? 'clickable' : ''}`;
    };

    const getShiftHeaderStyle = (shift) => {
        const baseColor = getShiftColor(shift);
        return {backgroundColor: baseColor, color: getContrastTextColor(baseColor)};
    };
    // Вычисляет стиль для всей ячейки-заголовка (<th> или <td>)
    const getShiftHeaderCellStyle = (shift) => {
        const neutralBgAlpha = currentTheme === 'dark' ? 0.1 : 0.5;
        const baseColor = getShiftColor(shift);
        return {
            backgroundColor: hexToRgba(baseColor, neutralBgAlpha),
        };
    };

    if (loading) return <LoadingState/>;
    if (error) return <Container className="mt-4"><PageHeader title={t('constraints.title')}/><ErrorMessage
        error={error}/></Container>;
    if (!weeklyTemplate) return <Container className="mt-4"><PageHeader title={t('constraints.title')}/><ErrorMessage
        error={t('constraints.noTemplate')} variant="info"/></Container>;


    const limitParams = {
        cannotWork: weeklyTemplate.constraints.limits.cannot_work_days,
        preferWork: weeklyTemplate.constraints.limits.prefer_work_days
    };
    const employeeName = formatEmployeeName(weeklyTemplate.employee);

    return (
        <Container fluid className="employee-constraints-container position-relative">
            <PageHeader
                icon="shield-check"
                title={t('constraints.title')}
                subtitle={t('constraints.subtitle')}
            />

            <Card className="p-0 mb-2 mb-md-3 constrains-card">
                <ScheduleHeaderCard
                    className="mb-1"
                    title={t('schedule.nextWeek')}
                    week={weeklyTemplate.weekStart}
                    // position={weeklyTemplate.employee?.position}
                    // empName={employeeName}
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
            <ToastContainer className="p-3 toast-container" style={{zIndex: 1056}}>
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