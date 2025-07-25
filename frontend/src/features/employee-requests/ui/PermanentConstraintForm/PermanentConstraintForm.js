// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintForm.js
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import { constraintAPI } from 'shared/api/apiService';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';
import './PermanentConstraintForm.css';
import {getDayNames} from "shared/lib/utils/scheduleUtils";



const PermanentConstraintForm = ({ onSubmitSuccess, onCancel }) => {
    const { t } = useI18n();
    const DAYS_OF_WEEK = getDayNames(t);
    const dispatch = useDispatch();
    const { getShiftColor } = useShiftColor();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [constraints, setConstraints] = useState({});
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [shifts, setShifts] = useState([]);
    const [justChangedCell, setJustChangedCell] = useState(null);

    // Persist message in localStorage
    useEffect(() => {
        const savedMessage = localStorage.getItem('permanent_constraint_message');
        if (savedMessage) {
            setMessage(savedMessage);
            setShowMessage(true);
        }
    }, []);

    useEffect(() => {
        if (showMessage) {
            localStorage.setItem('permanent_constraint_message', message);
        }
    }, [message, showMessage]);

    // Load employee shifts
    useEffect(() => {
        loadEmployeeShifts();
    }, []);

    const loadEmployeeShifts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await constraintAPI.getEmployeeShifts();
            setShifts(response.data?.shifts || []);
        } catch (error) {
            console.error('Error loading shifts:', error);
            setError(t('requests.load_shifts_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (day, shiftId) => {
        const key = `${day}-${shiftId}`;
        setJustChangedCell(key);

        setConstraints(prev => {
            const current = prev[key];

            // Only toggle between cannot_work and neutral
            if (current === 'cannot_work') {
                const { [key]: _, ...rest } = prev;
                return rest;
            } else {
                return { ...prev, [key]: 'cannot_work' };
            }
        });

        // Clear animation after delay
        setTimeout(() => setJustChangedCell(null), 500);
    };

    const handleDayClick = (day) => {
        const dayKeys = shifts.map(s => `${day}-${s.id}`);
        const allSelected = dayKeys.every(key => constraints[key] === 'cannot_work');

        setConstraints(prev => {
            if (allSelected) {
                // Remove all constraints for this day
                const newConstraints = { ...prev };
                dayKeys.forEach(key => delete newConstraints[key]);
                return newConstraints;
            } else {
                // Set all shifts for this day to cannot_work
                const updates = {};
                dayKeys.forEach(key => {
                    updates[key] = 'cannot_work';
                });
                return { ...prev, ...updates };
            }
        });
    };

    const getCellStyles = (day, shiftId) => {
        const key = `${day}-${shiftId}`;
        const constraintType = constraints[key];
        const isJustChanged = key === justChangedCell;

        const shiftColor = getShiftColor(shiftId);
        const contrastColor = getContrastTextColor(shiftColor);

        let backgroundColor = 'transparent';
        let foregroundClasses = 'constraint-cell neutral clickable';

        if (constraintType === 'cannot_work') {
            backgroundColor = '#dc3545'; // Bootstrap danger color
            foregroundClasses = 'constraint-cell cannot-work clickable';
        }

        if (isJustChanged) {
            foregroundClasses += ' is-appearing';
        }

        return {
            tdStyle: { backgroundColor: shiftColor },
            foregroundStyle: { backgroundColor },
            foregroundClasses,
            nextStatus: constraintType === 'cannot_work' ? 'neutral' : 'cannot_work'
        };
    };

    const prepareConstraintsArray = () => {
        const constraintsArray = [];

        Object.entries(constraints).forEach(([key, constraintType]) => {
            const [day, shiftId] = key.split('-');

            constraintsArray.push({
                day_of_week: day,
                shift_id: parseInt(shiftId),
                constraint_type: constraintType
            });
        });

        return constraintsArray;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const constraintsArray = prepareConstraintsArray();

            await constraintAPI.submitPermanentRequest({
                constraints: constraintsArray,
                message: showMessage && message.trim() ? message.trim() : null
            });

            // Clear form after successful submission
            localStorage.removeItem('permanent_constraint_message');
            setMessage('');
            setShowMessage(false);
            setConstraints({});

            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            dispatch({
                type: 'notifications/addNotification',
                payload: {
                    type: 'error',
                    message: t('requests.submit_error')
                }
            });
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const getShiftHeaderStyle = (shift) => {
        const bgColor = getShiftColor(shift.id);
        const textColor = getContrastTextColor(bgColor);
        return { backgroundColor: bgColor, color: textColor };
    };

    const usedCount = Object.keys(constraints).length;

    if (loading && shifts.length === 0) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={loadEmployeeShifts} />;
    }

    return (
        <>
            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('requests.permanent_constraints.title')}</h5>
                        <Button
                            variant="link"
                            onClick={onCancel}
                            className="p-0"
                        >
                            <X size={24} />
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {shifts.length === 0 ? (
                        <Alert variant="info">
                            {t('requests.no_position_assigned')}
                        </Alert>
                    ) : (
                        <>
                            <div className="permanent-constraint-grid">
                                <table className="table table-bordered constraint-table">
                                    <thead>
                                    <tr>
                                        <th className="day-header">{t('common.day')}</th>
                                        {shifts.map(shift => (
                                            <th
                                                key={shift.id}
                                                className="shift-header"
                                                style={getShiftHeaderStyle(shift)}
                                            >
                                                {shift.shift_name}
                                            </th>
                                        ))}
                                        <th className="action-header">{t('requests.block_day')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {DAYS_OF_WEEK.map(day => (
                                        <tr key={day}>
                                            <td className="day-cell">
                                                {day}
                                            </td>
                                            {shifts.map(shift => {
                                                const styles = getCellStyles(day, shift.id);
                                                return (
                                                    <td
                                                        key={shift.id}
                                                        className="constraint-td-wrapper"
                                                        style={styles.tdStyle}
                                                    >
                                                        <div
                                                            className={styles.foregroundClasses}
                                                            style={styles.foregroundStyle}
                                                            onClick={() => handleCellClick(day, shift.id)}
                                                        >
                                                            {constraints[`${day}-${shift.id}`] === 'cannot_work' && (
                                                                <X className="cell-icon" />
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="action-cell">
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDayClick(day)}
                                                >
                                                    {t('requests.block_day')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="constraint-info mt-3">
                                <small className="text-muted">
                                    {t('requests.constraintsCount', { count: usedCount })}
                                </small>
                            </div>

                            <Form.Group className="mt-3">
                                <Form.Check
                                    type="checkbox"
                                    id="include-message"
                                    label={t('requests.includeMessage')}
                                    checked={showMessage}
                                    onChange={(e) => setShowMessage(e.target.checked)}
                                />
                            </Form.Group>

                            {showMessage && (
                                <Form.Group className="mt-3">
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={t('requests.message_placeholder')}
                                    />
                                </Form.Group>
                            )}

                            <div className="mt-4 d-flex justify-content-end gap-2">
                                <Button variant="secondary" onClick={onCancel}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowConfirm(true)}
                                    disabled={Object.keys(constraints).length === 0}
                                >
                                    {t('common.submit')}
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={showConfirm}
                onHide={() => setShowConfirm(false)}
                onConfirm={handleSubmit}
                title={t('requests.confirm_submit.title')}
                message={t('requests.confirm_submit.message')}
                confirmText={t('common.submit')}
                cancelText={t('common.cancel')}
                confirmVariant="primary"
            />
        </>
    );
};

export default PermanentConstraintForm;