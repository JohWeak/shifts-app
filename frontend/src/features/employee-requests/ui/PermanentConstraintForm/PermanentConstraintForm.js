// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintForm.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Form, Modal } from 'react-bootstrap';
import { constraintAPI } from '../../../../shared/api/apiService';
import { useI18n } from '../../../../shared/lib/i18n/i18nProvider';
import ConfirmationModal from '../../../../shared/ui/components/ConfirmationModal/ConfirmationModal';
import LoadingState from '../../../../shared/ui/components/LoadingState/LoadingState';
import './PermanentConstraintForm.css';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const PermanentConstraintForm = ({ onSubmitSuccess, onCancel }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [constraints, setConstraints] = useState({});
    const [message, setMessage] = useState('');
    const [shifts, setShifts] = useState([]);

    // Persist message in localStorage
    useEffect(() => {
        const savedMessage = localStorage.getItem('permanent_constraint_message');
        if (savedMessage) {
            setMessage(savedMessage);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('permanent_constraint_message', message);
    }, [message]);

    // Load employee shifts
    useEffect(() => {
        loadEmployeeShifts();
    }, []);

    const loadEmployeeShifts = async () => {
        try {
            setLoading(true);
            // Load employee position and shifts
            const response = await constraintAPI.getEmployeeShifts();
            setShifts(response.data.shifts || []);
        } catch (error) {
            console.error('Error loading shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (day, shiftId, constraintType) => {
        const key = `${day}-${shiftId || 'all'}`;
        setConstraints(prev => {
            const current = prev[key];

            // Toggle constraint type
            if (current === constraintType) {
                const { [key]: _, ...rest } = prev;
                return rest;
            } else {
                return { ...prev, [key]: constraintType };
            }
        });
    };

    const handleDayClick = (day, constraintType) => {
        const dayKeys = shifts.map(s => `${day}-${s.shift_id}`);
        const allSelected = dayKeys.every(key => constraints[key] === constraintType);

        setConstraints(prev => {
            if (allSelected) {
                // Remove all constraints for this day
                const newConstraints = { ...prev };
                dayKeys.forEach(key => delete newConstraints[key]);
                return newConstraints;
            } else {
                // Set all shifts for this day to the constraint type
                const updates = {};
                dayKeys.forEach(key => {
                    updates[key] = constraintType;
                });
                return { ...prev, ...updates };
            }
        });
    };

    const prepareConstraintsArray = () => {
        const constraintsArray = [];

        Object.entries(constraints).forEach(([key, constraintType]) => {
            const [day, shiftId] = key.split('-');

            if (shiftId === 'all') {
                // Whole day constraint
                constraintsArray.push({
                    day_of_week: day,
                    shift_id: null,
                    constraint_type: constraintType
                });
            } else {
                // Specific shift constraint
                constraintsArray.push({
                    day_of_week: day,
                    shift_id: parseInt(shiftId),
                    constraint_type: constraintType
                });
            }
        });

        return constraintsArray;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const constraintsArray = prepareConstraintsArray();

            await constraintAPI.submitPermanentRequest({
                constraints: constraintsArray,
                message: message.trim() || null
            });

            // Clear form after successful submission
            localStorage.removeItem('permanent_constraint_message');
            setMessage('');
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

    const getCellClass = (day, shiftId) => {
        const key = `${day}-${shiftId}`;
        const constraintType = constraints[key];

        if (constraintType === 'cannot_work') return 'cannot-work';
        if (constraintType === 'prefer_work') return 'prefer-work';
        return '';
    };

    if (loading && shifts.length === 0) {
        return <LoadingState />;
    }

    return (
        <>
            <Card>
                <Card.Header>
                    <h5>{t('requests.permanent_constraints.title')}</h5>
                </Card.Header>
                <Card.Body>
                    <div className="permanent-constraint-grid">
                        <table className="table table-bordered">
                            <thead>
                            <tr>
                                <th>{t('common.day')}</th>
                                {shifts.map(shift => (
                                    <th key={shift.shift_id}>
                                        {shift.shift_name}
                                    </th>
                                ))}
                                <th>{t('requests.all_day')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {DAYS_OF_WEEK.map(day => (
                                <tr key={day}>
                                    <td>{t(`common.days.${day}`)}</td>
                                    {shifts.map(shift => (
                                        <td
                                            key={shift.shift_id}
                                            className={`constraint-cell ${getCellClass(day, shift.shift_id)}`}
                                            onClick={() => handleCellClick(day, shift.shift_id,
                                                constraints[`${day}-${shift.shift_id}`] === 'cannot_work'
                                                    ? 'prefer_work'
                                                    : 'cannot_work'
                                            )}
                                        >
                                            {constraints[`${day}-${shift.shift_id}`] && (
                                                <i className={`bi bi-${
                                                    constraints[`${day}-${shift.shift_id}`] === 'cannot_work'
                                                        ? 'x-circle'
                                                        : 'check-circle'
                                                }`} />
                                            )}
                                        </td>
                                    ))}
                                    <td
                                        className="all-day-cell"
                                        onClick={() => handleDayClick(day, 'cannot_work')}
                                    >
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="w-100"
                                        >
                                            {t('requests.block_day')}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <Form.Group className="mt-3">
                        <Form.Label>{t('requests.message_optional')}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('requests.message_placeholder')}
                        />
                    </Form.Group>

                    <div className="mt-3 d-flex justify-content-end gap-2">
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