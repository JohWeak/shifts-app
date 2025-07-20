// frontend/src/features/employee-constraints/index.js
import React, {useState, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container, Toast, ToastContainer} from 'react-bootstrap';
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
    const {getShiftColor} = useShiftColor();
    const isMobile = useMediaQuery('(max-width: 768px)');

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

    // --- ЛОГ №2: РЕЗУЛЬТАТ В REDUX ---
    // Этот хук сработает КАЖДЫЙ РАЗ, когда weeklyConstraints изменится.
    useEffect(() => {
        console.log(`%c[LOG 2] Состояние weeklyConstraints было обновлено:`, 'color: blue; font-weight: bold;', JSON.parse(JSON.stringify(weeklyConstraints)));
    }, [weeklyConstraints]);


    const [colorPickerConfig, setColorPickerConfig] = useState({show: false, mode: null, initialColor: '#ffffff'});
    const [shiftColors, setShiftColors] = useState(() => {
        const savedColors = localStorage.getItem('constraintColors');
        return savedColors ? JSON.parse(savedColors) : {cannot_work: '#dc3545', prefer_work: '#28a745'};
    });
    const [showInstructionsToast, setShowInstructionsToast] = useState(false);
    const LIMIT_ERROR_NOTIFICATION_ID = 'constraint-limit-error';

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
        // --- ЛОГ №1: НАМЕРЕНИЕ ---
        console.log(`%c[LOG 1] КЛИК! Отправляю экшен:`, 'color: green; font-weight: bold;', {
            date,
            shiftId,
            status: newStatus
        });
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

        // --- 1. Стили для состояния покоя ---
        const alpha = 1.0;
        const neutralBaseAlpha = 0.2;

        let solidRestingColor;
        if (status === 'cannot_work' || status === 'prefer_work') {
            solidRestingColor = shiftColors[status];
        } else {
            solidRestingColor = shift ? getShiftColor(shift) : '#6c757d';
        }

        const restingBackgroundColor = hexToRgba(solidRestingColor, (status !== 'neutral' ? alpha : neutralBaseAlpha));
        const textColor = getContrastTextColor(solidRestingColor);

        // --- 2. Стили для состояния наведения ---
        const hoverAlpha = 0.7;
        const neutralHoverAlpha = 0.4;

        let solidHoverColor;
        if (nextStatus === 'cannot_work' || nextStatus === 'prefer_work') {
            solidHoverColor = shiftColors[nextStatus];
        } else {
            solidHoverColor = shift ? getShiftColor(shift) : '#6c757d';
        }
        const hoverBackgroundColor = hexToRgba(solidHoverColor, (nextStatus !== 'neutral' ? hoverAlpha : neutralHoverAlpha));

        // --- 3. Возвращаем ПОЛНЫЙ и ПРАВИЛЬНЫЙ объект стилей ---
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

    const handleColorSelect = (newColor) => {
        const {mode} = colorPickerConfig;
        if (!mode) return;
        const newColors = {...shiftColors, [mode]: newColor};
        setShiftColors(newColors);
        localStorage.setItem('constraintColors', JSON.stringify(newColors));
        setColorPickerConfig({show: false, mode: null, initialColor: '#ffffff'});
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
                        {t('constraints.instructions.limits', limitParams)}
                    </p>
                </div>
            )}

            <ConstraintActions
                currentMode={currentMode}
                onModeChange={(mode) => dispatch(setCurrentMode(mode))}
                isSubmitted={isSubmitted}
                onColorButtonClick={(mode) => setColorPickerConfig({show: true, mode, initialColor: shiftColors[mode]})}
                onSubmit={handleSubmit}
                onEdit={() => dispatch(enableEditing())}
                onClear={() => {
                    dispatch(resetConstraints());
                    dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));
                }}
                submitting={submitting}
                onShowInstructions={() => setShowInstructionsToast(true)}
            />

            <ToastContainer position="bottom-end" className="p-3" style={{zIndex: 1055}}>
                <Toast onClose={() => setShowInstructionsToast(false)} show={showInstructionsToast} delay={10000}
                       autohide>
                    <Toast.Header><strong
                        className="me-auto">{t('constraints.instructions.title')}</strong></Toast.Header>
                    <Toast.Body>
                        <ul className="mb-0 ps-3">
                            <li>{t('constraints.instructions.selectMode')}</li>
                            <li>{t('constraints.instructions.clickCells')}</li>
                            {weeklyTemplate && <li>{t('constraints.instructions.limits', limitParams)}</li>}
                        </ul>
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            {colorPickerConfig.show && (
                <ColorPickerModal
                    show={colorPickerConfig.show}
                    onHide={() => setColorPickerConfig({show: false, mode: null, initialColor: '#ffffff'})}
                    onColorSelect={handleColorSelect}
                    title={t(`constraints.${colorPickerConfig.mode}_color`)}
                    initialColor={colorPickerConfig.initialColor}
                    saveMode="local"
                />
            )}
        </Container>
    );
};

export default ConstraintsSchedule;