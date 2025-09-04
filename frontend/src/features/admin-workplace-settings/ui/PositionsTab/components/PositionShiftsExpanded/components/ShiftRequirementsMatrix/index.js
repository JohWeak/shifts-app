// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionShiftsExpanded/components/ShiftRequirementsMatrix/index.js
import React, {useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from "motion/react";
import {Alert, Badge, Button, Form, Spinner, Table} from 'react-bootstrap';
import {isEqual} from 'lodash';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import {useDispatch, useSelector} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useBlocker} from 'react-router-dom';

import {
    createShiftRequirement,
    fetchRequirementsMatrix,
    updateShiftRequirement,
} from '../../../../../../model/workplaceSlice';
import './ShiftRequirementsMatrix.css';

const ShiftRequirementsMatrix = ({positionId, shifts, onUpdate, renderActions}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const {
        requirementsMatrix,
        matrixLoading,
        error,
    } = useSelector(state => state.workplace);

    const reduxMatrix = requirementsMatrix[positionId];
    const [localMatrix, setLocalMatrix] = useState(null);
    const [isChanged, setIsChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showButtons, setShowButtons] = useState(false);

    // Состояние для модального окна
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const blocker = useBlocker(isChanged);


    const daysOfWeek = [
        {id: 0, name: t('days.sunday'), short: t('days.sun')},
        {id: 1, name: t('days.monday'), short: t('days.mon')},
        {id: 2, name: t('days.tuesday'), short: t('days.tue')},
        {id: 3, name: t('days.wednesday'), short: t('days.wed')},
        {id: 4, name: t('days.thursday'), short: t('days.thu')},
        {id: 5, name: t('days.friday'), short: t('days.fri')},
        {id: 6, name: t('days.saturday'), short: t('days.sat')},
    ];
    // Эффект для блокировки ухода со страницы, если есть изменения
    useEffect(() => {
        if (blocker && blocker.state === 'blocked') {
            setShowConfirmModal(true);
        }
    }, [blocker]);
    useEffect(() => {
        if (reduxMatrix) {
            // Используем глубокое копирование, чтобы избежать мутаций
            setLocalMatrix(JSON.parse(JSON.stringify(reduxMatrix)));
        }
    }, [reduxMatrix]);

    useEffect(() => {
        if (localMatrix && reduxMatrix) {
            setIsChanged(!isEqual(localMatrix, reduxMatrix));
        } else {
            setIsChanged(false);
        }
    }, [localMatrix, reduxMatrix]);

    // Логика показа кнопок с задержкой, чтобы избежать мерцания
    useEffect(() => {
        if (isChanged) {
            // Если есть изменения, показываем кнопки с небольшой задержкой
            const timeoutId = setTimeout(() => {
                setShowButtons(true);
            }, 150);
            return () => clearTimeout(timeoutId);
        } else {
            // Если нет изменений, сразу прячем кнопки
            setShowButtons(false);
        }
    }, [isChanged]);


    // Мемоизируем ключевые данные о сменах для стабильности
    const shiftsKey = useMemo(() => {
        const key = shifts.map(s => `${s.id}-${s.shift_name}-${s.start_time}-${s.end_time}`).sort().join('|');
        return key;
    }, [shifts]);

    // Упрощаем логику - всегда обновляем при первом рендере или изменении shiftsKey
    useEffect(() => {
        if (!positionId || !shiftsKey) return;

        // Если у нас есть кэшированная матрица и она содержит те же смены
        const cachedMatrixShiftsKey = reduxMatrix?.shifts
            ?.map(s => `${s.id}-${s.name}-${s.start_time}-${s.end_time}`)
            ?.sort()
            ?.join('|') || '';

        const needsRefresh = cachedMatrixShiftsKey !== shiftsKey;

        if (needsRefresh) {
            dispatch(fetchRequirementsMatrix({positionId, forceRefresh: true}));
        }
    }, [positionId, shiftsKey, dispatch, reduxMatrix?.shifts]);


    const handleCellChange = (shiftId, dayOfWeek, value) => {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0 && numValue <= 99) {
            setLocalMatrix(prev => {
                const newMatrix = JSON.parse(JSON.stringify(prev)); // Глубокая копия
                const shiftIndex = newMatrix.shifts.findIndex(s => s.id === shiftId);

                if (shiftIndex !== -1) {
                    newMatrix.shifts[shiftIndex].requirements[dayOfWeek] = {
                        ...newMatrix.shifts[shiftIndex].requirements[dayOfWeek],
                        required_staff: numValue,
                        is_working_day: numValue > 0,
                    };
                }
                return newMatrix;
            });
        }
    };

    const handleStepChange = (shiftId, dayOfWeek, step) => {
        // Находим текущее значение
        const currentShift = localMatrix.shifts.find(s => s.id === shiftId);
        if (!currentShift) return;
        const currentValue = currentShift.requirements[dayOfWeek]?.required_staff || 0;

        // Вычисляем новое значение, не выходя за пределы min/max
        let newValue = currentValue + step;
        if (newValue < 0) newValue = 0;
        if (newValue > 99) newValue = 99;

        // Вызываем уже существующий обработчик изменений
        handleCellChange(shiftId, dayOfWeek, newValue.toString());
    };

    const handleReset = () => {
        if (reduxMatrix) {
            setLocalMatrix(JSON.parse(JSON.stringify(reduxMatrix)));
        }
    };

    const handleSave = async () => {
        if (!isChanged) return;
        setIsSaving(true);
        const changesToCreate = [];
        const changesToUpdate = [];

        localMatrix.shifts.forEach((shift) => {
            daysOfWeek.forEach(day => {
                const localReq = shift.requirements[day.id];
                const originalShift = reduxMatrix.shifts.find(s => s.id === shift.id);
                if (!originalShift) return;
                const originalReq = originalShift.requirements[day.id];

                const needsUpdate = localReq.required_staff !== originalReq.required_staff;
                const needsCreate = !originalReq.requirement_id && localReq.required_staff > 0;

                if (needsUpdate || needsCreate) {
                    const payload = {
                        day_of_week: day.id,
                        required_staff_count: localReq.required_staff,
                        is_working_day: localReq.required_staff > 0,
                        is_recurring: true,
                    };

                    if (originalReq.requirement_id) {
                        changesToUpdate.push(dispatch(updateShiftRequirement({
                            requirementId: originalReq.requirement_id,
                            data: payload,
                        })));
                    } else {
                        changesToCreate.push(dispatch(createShiftRequirement({
                            shiftId: shift.id,
                            data: payload,
                        })));
                    }
                }
            });
        });

        try {
            await Promise.all([...changesToUpdate, ...changesToCreate]);
            dispatch(fetchRequirementsMatrix({positionId}));
        } catch (err) {
            console.error('Failed to save changes:', err);
        } finally {
            setIsSaving(false);
            setIsChanged(false);
        }
    };


    const handleConfirmSave = async () => {
        await handleSave();
        setShowConfirmModal(false);
        setTimeout(() => {
            if (blocker && blocker.proceed) {
                blocker.proceed();
            }
        }, 0);
    };

    const handleConfirmReset = () => {
        handleReset();
        setShowConfirmModal(false);
        setTimeout(() => {
            if (blocker && blocker.proceed) {
                blocker.proceed();
            }
        }, 0);
    };


    const getTotalForDay = (dayOfWeek) => {
        if (!localMatrix) return 0;
        return localMatrix.shifts.reduce((sum, shift) => {
            return sum + (shift.requirements[dayOfWeek]?.required_staff || 0);
        }, 0);
    };

    const getTotalForShift = (shift) => {
        let total = 0;
        for (let day = 0; day < 7; day++) {
            total += shift.requirements[day]?.required_staff || 0;
        }
        return total;
    };

    // Показываем спиннер только если нет матрицы вообще (первая загрузка)
    if (matrixLoading && !reduxMatrix) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border"/>
                <p className="mt-3">{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger">
                {error}
                <Button
                    variant="link"
                    size="sm"
                    onClick={onUpdate}
                    className="ms-2"
                >
                    {t('common.retry')}
                </Button>
            </Alert>
        );
    }

    if (!localMatrix || !shifts.length) {
        return (
            <Alert variant="info">
                {t('workplace.shifts.noShiftsForMatrix')}
            </Alert>
        );
    }

    return (
        <div className="requirements-matrix-container">
            <div className="matrix-header mb-3">
                <h6>{t('workplace.shifts.staffRequirements')}</h6>
                <small className="text-muted">
                    {t('workplace.shifts.staffRequirementsHint')}
                </small>
            </div>

            <div className="table-responsive">
                <Table bordered className="requirements-matrix">
                    <thead>
                    <tr>
                        <th className="shift-header">{t('workplace.shifts.shift')}</th>
                        {daysOfWeek.map(day => (
                            <th key={day.id} className="day-header">
                                <div className="d-none d-md-block">{day.name}</div>
                                <div className="d-md-none">{day.short}</div>
                            </th>
                        ))}
                        <th className="total-header">{t('common.total')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <AnimatePresence>
                        {localMatrix?.shifts.map(shift => (
                            <motion.tr
                                key={shift.id}
                                initial={{opacity: 0, height: 0}}
                                animate={{opacity: 1, height: "auto"}}
                                exit={{opacity: 0, height: 0}}
                                transition={{
                                    duration: 0.3,
                                    ease: "easeOut"
                                }}
                                className="matrix-row"
                            >
                                <td className="shift-cell">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="shift-color-dot me-2"
                                            style={{backgroundColor: shift.color}}
                                        />
                                        <div>
                                            <div className="fw-semibold">{shift.name}</div>
                                            <small className="text-muted">
                                                {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                            </small>
                                        </div>
                                    </div>
                                </td>
                                {daysOfWeek.map(day => {
                                    const requirement = shift.requirements[day.id];

                                    return (
                                        <td key={day.id} className="requirement-cell">
                                            <div className="custom-number-input">
                                                <button
                                                    type="button"
                                                    className="btn-increment"
                                                    onClick={() => handleStepChange(shift.id, day.id, +1)}
                                                    tabIndex="-1"
                                                >
                                                    +
                                                </button>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    max="99"
                                                    value={requirement?.required_staff || 0}
                                                    onChange={(e) => handleCellChange(shift.id, day.id, e.target.value)}
                                                    className={`requirement-input ${requirement?.required_staff === 0 ? 'non-working' : ''}`}
                                                />

                                                <button
                                                    type="button"
                                                    className="btn-decrement"
                                                    onClick={() => handleStepChange(shift.id, day.id, -1)}
                                                    tabIndex="-1"
                                                >
                                                    -
                                                </button>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="total-cell">
                                    <Badge bg="secondary" className="total-badge">
                                        {getTotalForShift(shift)}
                                    </Badge>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                    </tbody>
                    <tfoot>
                    <tr>
                        <td className="total-label">{t('common.total')}</td>
                        {daysOfWeek.map(day => (
                            <td key={day.id} className="day-total">
                                <Badge bg="primary">
                                    {getTotalForDay(day.id)}
                                </Badge>
                            </td>
                        ))}
                        <td className="grand-total">
                            <Badge bg="success">
                                {localMatrix.shifts.reduce((total, shift) =>
                                    total + getTotalForShift(shift), 0,
                                )}
                            </Badge>
                        </td>
                    </tr>
                    </tfoot>
                </Table>
            </div>

            <div className="matrix-legend mt-3">
                <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    {t('workplace.shifts.matrixLegend')}
                </small>
            </div>
            {renderActions && renderActions({
                isChanged: showButtons, // Используем showButtons вместо isChanged для отображения кнопок
                isSaving,
                handleSave,
                handleReset,
            })}

            {/* Модальное окно */}
            <ConfirmationModal
                show={showConfirmModal}
                title={t('common.unsavedChanges')}
                message={t('common.unsavedChangesMessage')}
                onHide={handleConfirmReset}
                onConfirm={handleConfirmSave}
                loading={isSaving}
                confirmText={t('common.saveAndContinue')}
                confirmVariant="success"
                cancelText={t('common.discardChanges')}
            >
            </ConfirmationModal>
        </div>
    );
};

export default ShiftRequirementsMatrix;