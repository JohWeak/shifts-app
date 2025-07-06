// frontend/src/features/admin-workplace-settings/ui/ShiftRequirementsMatrix/ShiftRequirementsMatrix.js
import React, { useState, useEffect } from 'react';
import {
    Table,
    Form,
    Button,
    Badge,
    Alert,
    OverlayTrigger,
    Tooltip,
    Spinner
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    fetchRequirementsMatrix,
    updateShiftRequirement,
    createShiftRequirement
} from '../../model/workplaceSlice';
import './ShiftRequirementsMatrix.css';

const ShiftRequirementsMatrix = ({ positionId, shifts, onUpdate }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const {
        requirementsMatrix,
        matrixLoading,
        error
    } = useSelector(state => state.workplace);

    const matrix = requirementsMatrix[positionId];
    const [saving, setSaving] = useState({});

    const daysOfWeek = [
        { id: 0, name: t('days.sunday'), short: t('days.sun') },
        { id: 1, name: t('days.monday'), short: t('days.mon') },
        { id: 2, name: t('days.tuesday'), short: t('days.tue') },
        { id: 3, name: t('days.wednesday'), short: t('days.wed') },
        { id: 4, name: t('days.thursday'), short: t('days.thu') },
        { id: 5, name: t('days.friday'), short: t('days.fri') },
        { id: 6, name: t('days.saturday'), short: t('days.sat') }
    ];

    useEffect(() => {
        if (positionId) {
            dispatch(fetchRequirementsMatrix(positionId));
        }
    }, [positionId, dispatch]);

    const updateRequirement = async (shiftId, dayOfWeek, value) => {
        const key = `${shiftId}-${dayOfWeek}`;
        setSaving(prev => ({ ...prev, [key]: true }));

        try {
            const shift = matrix.shifts.find(s => s.id === shiftId);
            const requirement = shift.requirements[dayOfWeek];

            if (requirement.requirement_id) {
                await dispatch(updateShiftRequirement({
                    requirementId: requirement.requirement_id,
                    data: {
                        required_staff_count: value,
                        is_working_day: value > 0
                    }
                })).unwrap();
            } else {
                await dispatch(createShiftRequirement({
                    shiftId,
                    data: {
                        day_of_week: dayOfWeek,
                        required_staff_count: value,
                        is_recurring: true,
                        is_working_day: value > 0
                    }
                })).unwrap();
            }

            // Перезагружаем матрицу для обновления данных
            dispatch(fetchRequirementsMatrix(positionId));

        } catch (err) {
            console.error('Failed to update requirement:', err);
        } finally {
            setSaving(prev => ({ ...prev, [key]: false }));
        }
    };


    const handleCellChange = (shiftId, dayOfWeek, value) => {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0 && numValue <= 99) {
            updateRequirement(shiftId, dayOfWeek, numValue);
        }
    };

    const getTotalForDay = (dayOfWeek) => {
        if (!matrix) return 0;
        return matrix.shifts.reduce((sum, shift) => {
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

    if (matrixLoading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
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
                    onClick={() => dispatch(fetchRequirementsMatrix(positionId))}
                    className="ms-2"
                >
                    {t('common.retry')}
                </Button>
            </Alert>
        );
    }

    if (!matrix || !shifts.length) {
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
                <Table bordered hover className="requirements-matrix">
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
                    {matrix.shifts.map(shift => (
                        <tr key={shift.id}>
                            <td className="shift-cell">
                                <div className="d-flex align-items-center">
                                    <div
                                        className="shift-color-dot me-2"
                                        style={{ backgroundColor: shift.color }}
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
                                const key = `${shift.id}-${day.id}`;
                                const isSaving = saving[key];

                                return (
                                    <td key={day.id} className="requirement-cell">
                                        <div className="requirement-input-wrapper">
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                max="99"
                                                value={requirement?.required_staff || 0}
                                                onChange={(e) => handleCellChange(shift.id, day.id, e.target.value)}
                                                className={`requirement-input ${requirement?.required_staff === 0 ? 'non-working' : ''}`}
                                                disabled={isSaving}
                                            />
                                            {isSaving && (
                                                <div className="saving-indicator">
                                                    <Spinner size="sm" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                            <td className="total-cell">
                                <Badge bg="secondary" className="total-badge">
                                    {getTotalForShift(shift)}
                                </Badge>
                            </td>
                        </tr>
                    ))}
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
                                {matrix.shifts.reduce((total, shift) =>
                                    total + getTotalForShift(shift), 0
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
        </div>
    );
};

export default ShiftRequirementsMatrix;