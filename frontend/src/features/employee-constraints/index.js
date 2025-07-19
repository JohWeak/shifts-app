// frontend/src/features/employee-constraints/index.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Button, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { addNotification, removeNotification } from 'app/model/notificationsSlice';

// Components
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import ConstraintActions from './ui/ConstraintActions';
import ConstraintGrid from './ui/ConstraintGrid';

// Redux actions
import {
    fetchWeeklyConstraints,
    submitWeeklyConstraints,
    updateConstraint,
    setCurrentMode,
    clearSubmitStatus,
    enableEditing,
    resetConstraints
} from './model/constraintSlice';

import './index.css';
import {getShiftTypeByTime} from "../../shared/lib/utils/scheduleUtils";

const ConstraintsSchedule = () => {
    const dispatch = useDispatch();
    const { t } = useI18n();

    // Redux state
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

    const { user } = useSelector(state => state.auth);

    // Local state
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorPickerConfig, setColorPickerConfig] = useState(null);
    const [shiftColors, setShiftColors] = useState({
        cannotWork: '#dc3545',
        preferWork: '#28a745'
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

        // Очищаем уведомление при размонтировании компонента
        return () => {
            dispatch(removeNotification('constraints-already-submitted'));
        }

    }, [submitStatus, isSubmitted, loading, dispatch, t]);

    useEffect(() => {
        // Load saved colors from localStorage
        const savedColors = localStorage.getItem('constraintColors');
        if (savedColors) {
            setShiftColors(JSON.parse(savedColors));
        }
    }, []);



    const checkLimits = (newConstraints, modeToCheck) => {
        let count = 0;
        Object.keys(newConstraints).forEach(date => {
            const dayConstraints = newConstraints[date];
            // Check if any shift has this constraint
            const hasShiftConstraint = Object.values(dayConstraints.shifts).some(
                status => status === modeToCheck
            );
            if (hasShiftConstraint) {
                count++;
            }
        });

        const limits = weeklyTemplate?.constraints?.limits;
        if (modeToCheck === 'cannot_work' && count > limits?.cannot_work_days) {
            return t('constraints.errors.maxCannotWork', { max: limits.cannot_work_days });
        }
        if (modeToCheck === 'prefer_work' && count > limits?.prefer_work_days) {
            return t('constraints.errors.maxPreferWork', { max: limits.prefer_work_days });
        }
        return null;
    };

    const handleShowInstructions = () => {
        setShowInstructionsToast(true);
    };

    const handleEdit = () => {
        dispatch(enableEditing());
    };

    const handleClear = () => {
        dispatch(resetConstraints());
        // Также убираем возможное уведомление об ошибке
        dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));
    };

    const handleCellClick = (date, shiftType) => {
        if (!canEdit || isSubmitted) {
            return;
        }

        dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));

        const currentConstraints = weeklyConstraints[date] || { shifts: {} };
        const currentStatus = currentConstraints.shifts[shiftType] || 'neutral';

        let newStatus = 'neutral';

        if (shiftType) {
            // Сценарий 1: Клик по смене
            const currentStatus = weeklyConstraints[date]?.shifts[shiftType] || 'neutral';
            newStatus = (currentStatus === currentMode) ? 'neutral' : currentMode;
        } else {
            // Сценарий 2: Клик по дню
            const currentDayStatus = weeklyConstraints[date]?.day_status || 'neutral';
            newStatus = (currentDayStatus === currentMode) ? 'neutral' : currentMode;
        }

        // --- Проверка лимитов (общая для обоих случаев) ---
        // Если мы что-то добавляем (а не сбрасываем в neutral), то проверяем лимиты
        if (newStatus !== 'neutral') {
            // Создаем глубокую копию для безопасного "тестирования"
            const testConstraints = JSON.parse(JSON.stringify(weeklyConstraints));
            if (!testConstraints[date]) {
                testConstraints[date] = { day_status: 'neutral', shifts: {} };
            }

            // Имитируем изменение
            if (shiftType) {
                testConstraints[date].shifts[shiftType] = newStatus;
            } else { // Для всего дня
                const dayTemplate = weeklyTemplate.constraints.template.find(d => d.date === date);
                if (dayTemplate) {
                    dayTemplate.shifts.forEach(shift => {
                        const type = getShiftTypeByTime(shift.start_time, shift.duration);
                        testConstraints[date].shifts[type] = newStatus;
                    });
                }
            }

            // Запускаем проверку
            const limitError = checkLimits(testConstraints, newStatus);
            if (limitError) {
                dispatch(addNotification({
                    id: LIMIT_ERROR_NOTIFICATION_ID,
                    message: limitError,
                    variant: 'warning',
                    duration: 4000
                }));
                return; // Прерываем выполнение
            }
        }

        // Если все в порядке, диспатчим экшен.
        // Редьюсер сам разберется, что обновить, благодаря shiftType (или его отсутствию)
        dispatch(updateConstraint({ date, shiftType, status: newStatus }));
    };


    const getCellClass = (date, shiftType) => {
        if (!weeklyConstraints[date]) return 'constraint-cell neutral';

        const dayConstraints = weeklyConstraints[date];
        const status = dayConstraints.shifts[shiftType] || 'neutral';

        const baseClass = 'constraint-cell';
        const statusClass = status === 'cannot_work' ? 'cannot-work' :
            status === 'prefer_work' ? 'prefer-work' : 'neutral';
        const clickableClass = canEdit && !isSubmitted ? 'clickable' : '';

        return `${baseClass} ${statusClass} ${clickableClass}`;
    };

    const handleSubmit = async () => {
        const formattedConstraints = [];

        Object.keys(weeklyConstraints).forEach(date => {
            const dayConstraints = weeklyConstraints[date];

            // Check individual shift constraints
            Object.keys(dayConstraints.shifts).forEach(shiftType => {
                const status = dayConstraints.shifts[shiftType];
                if (status !== 'neutral') {
                    const shift = weeklyTemplate.constraints.template
                        .find(d => d.date === date)
                        ?.shifts.find(s => getShiftTypeByTime(s.start_time, s.duration) === shiftType);

                    if (shift) {
                        formattedConstraints.push({
                            emp_id: user.id,
                            constraint_type: status,
                            target_date: date,
                            applies_to: 'specific_date',
                            shift_id: shift.shift_id
                        });
                    }
                }
            });
        });

        dispatch(submitWeeklyConstraints({
            constraints: formattedConstraints,
            week_start: weeklyTemplate.weekStart
        }));
    };

    const handleColorChange = (colorType) => {
        setColorPickerConfig({
            type: colorType,
            currentColor: shiftColors[colorType],
            title: colorType === 'cannotWork'
                ? t('constraints.cannotWorkColor')
                : t('constraints.preferWorkColor')
        });
        setShowColorPicker(true);
    };

    const handleColorSelect = (color) => {
        const newColors = {
            ...shiftColors,
            [colorPickerConfig.type]: color
        };
        setShiftColors(newColors);
        localStorage.setItem('constraintColors', JSON.stringify(newColors));
        setShowColorPicker(false);
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <Container className="mt-4">
                <PageHeader title={t('constraints.title')} />
                <ErrorMessage error={error} />
            </Container>
        );
    }

    if (!weeklyTemplate) {
        return (
            <Container className="mt-4">
                <PageHeader title={t('constraints.title')} />
                <ErrorMessage error={t('constraints.noTemplate')} variant="info" />
            </Container>
        );
    }

    return (
        <Container fluid className="employee-constraints-container p-3">
            <PageHeader
                title={t('constraints.title')}
                subtitle={t('constraints.subtitle')}
            />

            <ConstraintGrid
                template={weeklyTemplate.constraints.template}
                constraints={weeklyConstraints}
                onCellClick={handleCellClick}
                getCellClass={getCellClass}
                shiftColors={shiftColors}
                canEdit={canEdit}
                isSubmitted={isSubmitted}
            />

            <ConstraintActions
                currentMode={currentMode}
                onModeChange={(mode) => dispatch(setCurrentMode(mode))}
                isSubmitted={isSubmitted}
                onShowColorSettings={() => setColorPickerConfig({ showSettings: true })}
                onSubmit={handleSubmit}
                onEdit={handleEdit}
                onClear={handleClear}
                submitting={submitting}
                onShowInstructions={handleShowInstructions}

            />
            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1055 }}>
                <Toast
                    onClose={() => setShowInstructionsToast(false)}
                    show={showInstructionsToast}
                    delay={10000} // 10 секунд
                    autohide
                >
                    <Toast.Header closeButton={true}>
                        <strong className="me-auto">{t('constraints.instructions.title')}</strong>
                    </Toast.Header>
                    <Toast.Body>
                        <ul className="mb-0 ps-3">
                            <li>{t('constraints.instructions.selectMode')}</li>
                            <li>{t('constraints.instructions.clickCells')}</li>
                            {weeklyTemplate && ( // Проверка на случай, если данные еще не загружены
                                <li>{t('constraints.instructions.limits', {
                                    cannotWork: weeklyTemplate.constraints.limits.cannot_work_days,
                                    preferWork: weeklyTemplate.constraints.limits.prefer_work_days
                                })}</li>
                            )}
                        </ul>
                    </Toast.Body>
                </Toast>
            </ToastContainer>


            {/* Color Picker Modal */}
            {showColorPicker && colorPickerConfig && !colorPickerConfig.showSettings && (
                <ColorPickerModal
                    show={showColorPicker}
                    onHide={() => setShowColorPicker(false)}
                    onColorSelect={handleColorSelect}
                    initialColor={colorPickerConfig.currentColor}
                    title={colorPickerConfig.title}
                />
            )}

            {/* Color Settings Modal */}
            {showColorPicker && colorPickerConfig?.showSettings && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('constraints.colorSettings')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowColorPicker(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">{t('constraints.cannotWorkColor')}</label>
                                    <div
                                        className="color-preview d-inline-block ms-2 border"
                                        style={{
                                            width: '30px',
                                            height: '30px',
                                            backgroundColor: shiftColors.cannotWork,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleColorChange('cannotWork')}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">{t('constraints.preferWorkColor')}</label>
                                    <div
                                        className="color-preview d-inline-block ms-2 border"
                                        style={{
                                            width: '30px',
                                            height: '30px',
                                            backgroundColor: shiftColors.preferWork,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleColorChange('preferWork')}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="secondary" onClick={() => setShowColorPicker(false)}>
                                    {t('common.close')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default ConstraintsSchedule;