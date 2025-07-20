// frontend/src/features/employee-constraints/index.js
import React, {useState, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container} from 'react-bootstrap';
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

// Redux actions & utils
import {
    fetchWeeklyConstraints,
    submitWeeklyConstraints,
    updateConstraint,
    setCurrentMode,
    clearSubmitStatus,
    enableEditing,
    resetConstraints
} from './model/constraintSlice';
import {getContrastTextColor, hexToRgba} from 'shared/lib/utils/colorUtils';
import './index.css';

const ConstraintsSchedule = () => {
    const dispatch = useDispatch();
    const {t} = useI18n();
    const isMobile = useMediaQuery('(max-width: 768px)');

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
        loading,
        submitting,
        error,
        submitStatus,
        currentMode,
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

    useEffect(() => {
        dispatch(fetchWeeklyConstraints({}));
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

    const handleCellClick = (date, shiftId) => {
        if (!canEdit || isSubmitted) return;
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

    // *** ИСПРАВЛЕННАЯ ФУНКЦИЯ ***
    const getCellStyle = (date, shiftId) => {
        const status = weeklyConstraints[date]?.shifts[shiftId] || 'neutral';
        const shift = uniqueShifts.find(s => s.shift_id === shiftId);
        const nextStatus = (status === currentMode) ? 'neutral' : currentMode;

        let solidRestingColor;
        if (status === 'neutral') {
            solidRestingColor = shift ? getShiftColor(shift) : '#6c757d';
        } else {
            // Используем хук для получения цвета статуса
            solidRestingColor = getShiftColor(constraintPseudoShifts[status]);
        }

        const restingBackgroundColor = hexToRgba(solidRestingColor, (status !== 'neutral' ? 1.0 : 0.2));
        const textColor = getContrastTextColor(solidRestingColor);

        let solidHoverColor;
        if (nextStatus === 'neutral') {
            solidHoverColor = shift ? getShiftColor(shift) : '#6c757d';
        } else {
            // Используем хук для получения цвета ховера
            solidHoverColor = getShiftColor(constraintPseudoShifts[nextStatus]);
        }
        const hoverBackgroundColor = hexToRgba(solidHoverColor, (nextStatus !== 'neutral' ? 0.7 : 0.4));

        return {
            backgroundColor: restingBackgroundColor,
            color: textColor,
            '--cell-hover-color': hoverBackgroundColor,
        };
    };


    const getCellClass = (date, shiftId) => {
        const status = weeklyConstraints[date]?.shifts[shiftId] || 'neutral';
        return `constraint-cell ${status} ${canEdit && !isSubmitted ? 'clickable' : ''}`;
    };

    const getDayHeaderClass = (date) => {
        const status = weeklyConstraints[date]?.day_status || 'neutral';
        return `day-header ${status} ${canEdit && !isSubmitted ? 'clickable' : ''}`;
    };

    const getShiftHeaderStyle = (shift) => {
        const baseColor = getShiftColor(shift);
        return {backgroundColor: baseColor, color: getContrastTextColor(baseColor)};
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

    return (
        <Container fluid className="employee-constraints-container p-3 position-relative">
            <PageHeader title={t('constraints.title')} subtitle={t('constraints.subtitle')}/>

            <ConstraintGrid
                template={weeklyTemplate.constraints.template}
                uniqueShifts={uniqueShifts}
                onCellClick={handleCellClick}
                getCellStyle={getCellStyle}
                getCellClass={getCellClass}
                getDayHeaderClass={getDayHeaderClass}
                getShiftHeaderStyle={getShiftHeaderStyle}
                isMobile={isMobile}
            />

            {weeklyTemplate?.constraints?.limits && (
                <div className="text-center mt-3">
                    <p className="text-muted small mb-0">
                        <i className="bi bi-info-circle me-1"/>
                        {t('constraints.instructions.limits', {
                            cannotWork: (weeklyTemplate.constraints.limits.cannot_work_days - usedCounts.cannot_work),
                            preferWork: (weeklyTemplate.constraints.limits.prefer_work_days - usedCounts.prefer_work)
                        })}
                    </p>

                </div>
            )}

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
                onSubmit={handleSubmit}
                onEdit={() => dispatch(enableEditing())}
                onClear={() => {
                    dispatch(resetConstraints());
                    dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));
                }}
                submitting={submitting}
                weeklyTemplate={weeklyTemplate}
                limitParams={limitParams}
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
        </Container>
    );
};

export default ConstraintsSchedule;