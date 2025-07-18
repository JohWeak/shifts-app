// frontend/src/features/employee-constraints/index.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Button, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { addNotification, removeNotification } from 'app/model/notificationsSlice';

// Components
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import ConstraintInstructions from './ui/ConstraintInstructions';
import ConstraintGrid from './ui/ConstraintGrid';

// Redux actions
import {
    fetchWeeklyConstraints,
    submitWeeklyConstraints,
    updateConstraint,
    setCurrentMode,
    clearSubmitStatus
} from './model/constraintSlice';

import './index.css';

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

        // Показываем уведомление, если ограничения уже были отправлены ранее
        if (!loading && isSubmitted) {
            dispatch(addNotification({
                id: 'constraints-already-submitted',
                message: t('constraints.alreadySubmitted'),
                variant: 'success', // Используем success для красивой зеленой галочки
                duration: 5000 // Пусть повисит 5 секунд
            }));
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

    const handleCellClick = (date, shiftType) => {
        if (!canEdit || isSubmitted) {
            return;
        }

        dispatch(removeNotification(LIMIT_ERROR_NOTIFICATION_ID));

        const currentConstraints = weeklyConstraints[date] || { shifts: {} };
        const currentStatus = currentConstraints.shifts[shiftType] || 'neutral';

        let newStatus = 'neutral';

        if (currentStatus !== currentMode) {
            // Check limits before applying
            const testConstraints = { ...weeklyConstraints };

            if (!testConstraints[date]) {
                testConstraints[date] = { shifts: {} };
            }

            testConstraints[date] = {
                ...testConstraints[date],
                shifts: {
                    ...testConstraints[date].shifts,
                    [shiftType]: currentMode
                }
            };

            const limitError = checkLimits(testConstraints, currentMode);
            if (limitError) {
                dispatch(addNotification({
                    id: LIMIT_ERROR_NOTIFICATION_ID, // Стабильный ID
                    message: limitError,
                    variant: 'warning',
                    duration: 4000
                }));
                return;
            }

            newStatus = currentMode;
        }

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
                        ?.shifts.find(s => s.shift_type === shiftType);

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
            />

            {/* Submit Button */}
            {canEdit && !isSubmitted && (
                <div className="text-center mt-4">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-2"
                    >
                        {submitting ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                {t('common.saving')}
                            </>
                        ) : (
                            t('constraints.submit')
                        )}
                    </Button>
                </div>
            )}

            <ConstraintInstructions
                currentMode={currentMode}
                onModeChange={(mode) => dispatch(setCurrentMode(mode))}
                limits={weeklyTemplate.constraints.limits}
                isSubmitted={isSubmitted}
                onShowColorSettings={() => setColorPickerConfig({ showSettings: true })}
            />


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