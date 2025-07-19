// frontend/src/features/employee-constraints/index.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    fetchWeeklyConstraints,
    submitWeeklyConstraints,
    updateConstraint,
    setCurrentMode,
    setLimitError,
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
        limitError,
        currentMode,
        isSubmitted,
        canEdit
    } = useSelector(state => state.constraints);

    const { user } = useSelector(state => state.auth);

    // Local state for UI effects
    const [shakeEffect, setShakeEffect] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Load constraints on component mount
        dispatch(fetchWeeklyConstraints({}));
    }, [dispatch]);

    useEffect(() => {
        // Handle submit success
        if (submitStatus === 'success') {
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                dispatch(clearSubmitStatus());
            }, 3000);
        }
    }, [submitStatus, dispatch]);

    const triggerShakeEffect = () => {
        setShakeEffect(true);
        setTimeout(() => setShakeEffect(false), 500);
    };

    const checkLimits = (newConstraints, modeToCheck) => {
        let count = 0;
        Object.keys(newConstraints).forEach(date => {
            const dayConstraints = newConstraints[date];
            // Check if whole day has this constraint
            if (dayConstraints.day_status === modeToCheck) {
                count++;
            } else {
                // Check if any shift has this constraint
                const hasShiftConstraint = Object.values(dayConstraints.shifts).some(
                    status => status === modeToCheck
                );
                if (hasShiftConstraint) {
                    count++;
                }
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

    const handleCellClick = (date, shiftType = null) => {
        if (!canEdit || isSubmitted) {
            return;
        }

        dispatch(setLimitError(''));

        const currentConstraints = weeklyConstraints[date] || { day_status: 'neutral', shifts: {} };
        const currentStatus = shiftType ?
            currentConstraints.shifts[shiftType] || 'neutral' :
            currentConstraints.day_status || 'neutral';

        let newStatus = 'neutral';

        if (currentStatus !== currentMode) {
            // Check limits before applying
            const testConstraints = { ...weeklyConstraints };

            if (shiftType) {
                testConstraints[date] = {
                    ...currentConstraints,
                    shifts: {
                        ...currentConstraints.shifts,
                        [shiftType]: currentMode
                    }
                };
            } else {
                // Set whole day
                const dayShifts = {};
                weeklyTemplate.constraints.template
                    .find(d => d.date === date)
                    ?.shifts.forEach(shift => {
                    dayShifts[shift.shift_type] = currentMode;
                });

                testConstraints[date] = {
                    day_status: currentMode,
                    shifts: dayShifts
                };
            }

            const limitError = checkLimits(testConstraints, currentMode);
            if (limitError) {
                dispatch(setLimitError(limitError));
                triggerShakeEffect();
                return;
            }

            newStatus = currentMode;
        }

        dispatch(updateConstraint({ date, shiftType, status: newStatus }));
    };

    const getCellClass = (date, shiftType = null) => {
        if (!weeklyConstraints[date]) return 'constraint-cell neutral';

        const dayConstraints = weeklyConstraints[date];
        let status;

        if (shiftType) {
            status = dayConstraints.shifts[shiftType] || 'neutral';
        } else {
            status = dayConstraints.day_status || 'neutral';
        }

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

            // Check whole day constraint
            if (dayConstraints.day_status !== 'neutral') {
                formattedConstraints.push({
                    emp_id: user.id,
                    constraint_type: dayConstraints.day_status,
                    target_date: date,
                    applies_to: 'specific_date'
                });
            } else {
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
            }
        });

        dispatch(submitWeeklyConstraints({
            constraints: formattedConstraints,
            week_start: weeklyTemplate.weekStart
        }));
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}/${month}`;
    };

    const getShiftIcon = (shiftType) => {
        const icons = {
            morning: '🌅',
            day: '☀️',
            night: '🌙'
        };
        return icons[shiftType] || '';
    };

    const formatTime = (startTime, duration) => {
        if (!startTime) return '';
        const [hours, minutes] = startTime.split(':');
        const start = `${hours}:${minutes}`;
        const endHours = parseInt(hours) + Math.floor(duration / 60);
        const endMinutes = parseInt(minutes) + (duration % 60);
        const end = `${endHours}:${endMinutes.toString().padStart(2, '0')}`;
        return `${start}-${end}`;
    };

    if (loading) {
        return (
            <div className="loading">
                <Spinner animation="border" />
                <span className="ms-2">{t('common.loading')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!weeklyTemplate) {
        return (
            <Container className="mt-4">
                <Alert variant="info">{t('constraints.noTemplate')}</Alert>
            </Container>
        );
    }

    const { cannotWorkColor, preferWorkColor } = weeklyTemplate.colors || {
        cannotWorkColor: '#dc3545',
        preferWorkColor: '#28a745'
    };

    return (
        <Container fluid className="employee-constraints-container p-3">
            {/* Header */}
            <Card className="shadow-sm mb-4 border-0">
                <Card.Header className="bg-white border-0 py-3">
                    <h1 className="display-4 mb-3">{t('constraints.title')}</h1>
                    <p className="text-muted lead">{t('constraints.subtitle')}</p>
                </Card.Header>
            </Card>

            {/* Instructions and Controls */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h5>{t('constraints.instructions.title')}</h5>
                            <ul className="mb-0">
                                <li>{t('constraints.instructions.selectMode')}</li>
                                <li>{t('constraints.instructions.clickCells')}</li>
                                <li>{t('constraints.instructions.limits', {
                                    cannotWork: weeklyTemplate.constraints.limits.cannot_work_days,
                                    preferWork: weeklyTemplate.constraints.limits.prefer_work_days
                                })}</li>
                            </ul>
                        </div>
                        <div className="col-md-4 text-end">
                            <div className="btn-group" role="group">
                                <Button
                                    variant={currentMode === 'cannot_work' ? 'danger' : 'outline-danger'}
                                    onClick={() => dispatch(setCurrentMode('cannot_work'))}
                                    disabled={isSubmitted}
                                    style={{
                                        backgroundColor: currentMode === 'cannot_work' ? cannotWorkColor : 'transparent',
                                        borderColor: cannotWorkColor
                                    }}
                                >
                                    {t('constraints.cannotWork')}
                                </Button>
                                <Button
                                    variant={currentMode === 'prefer_work' ? 'success' : 'outline-success'}
                                    onClick={() => dispatch(setCurrentMode('prefer_work'))}
                                    disabled={isSubmitted}
                                    style={{
                                        backgroundColor: currentMode === 'prefer_work' ? preferWorkColor : 'transparent',
                                        borderColor: preferWorkColor
                                    }}
                                >
                                    {t('constraints.preferWork')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {limitError && (
                        <Alert variant="warning" className={`mt-3 ${shakeEffect ? 'shake' : ''}`}>
                            {limitError}
                        </Alert>
                    )}

                    {showSuccess && (
                        <Alert variant="success" className="mt-3">
                            {t('constraints.submitSuccess')}
                        </Alert>
                    )}

                    {isSubmitted && (
                        <Alert variant="info" className="mt-3">
                            {t('constraints.alreadySubmitted')}
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Desktop Table */}
            <Card className="shadow desktop-constraints d-none d-md-block">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0">
                            <thead>
                            <tr>
                                <th className="text-center shift-header">{t('constraints.shiftTime')}</th>
                                {weeklyTemplate.constraints.template.map(day => (
                                    <th key={day.date} className="text-center">
                                        <div>{t(`calendar.weekDays.${day.weekday}`)}</div>
                                        <small className="text-muted">{formatDate(day.date)}</small>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {/* Whole day row */}
                            <tr>
                                <td className="shift-header text-center align-middle">
                                    <strong>{t('constraints.wholeDay')}</strong>
                                </td>
                                {weeklyTemplate.constraints.template.map(day => (
                                    <td key={`all-${day.date}`}
                                        className={getCellClass(day.date)}
                                        onClick={() => handleCellClick(day.date)}
                                    >
                                        {/* Empty cell for user interaction */}
                                    </td>
                                ))}
                            </tr>

                            {/* Individual shift rows */}
                            {Object.keys(weeklyTemplate.shiftTypes).map(shiftType => {
                                const sampleShift = weeklyTemplate.constraints.template[0]?.shifts
                                    .find(s => s.shift_type === shiftType);

                                if (!sampleShift) return null;

                                return (
                                    <tr key={shiftType}>
                                        <td className="shift-header align-middle text-center">
                                            {getShiftIcon(shiftType)}<br/>
                                            {formatTime(sampleShift.start_time, sampleShift.duration)}
                                        </td>
                                        {weeklyTemplate.constraints.template.map(day => (
                                            <td key={`${day.date}-${shiftType}`}
                                                className={getCellClass(day.date, shiftType)}
                                                onClick={() => handleCellClick(day.date, shiftType)}
                                            >
                                                {/* Empty cell for user interaction */}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Mobile Table */}
            <Card className="shadow mobile-constraints d-md-none">
                <Card.Body className="p-0">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="text-center">{t('common.day')}</th>
                            <th className="shift-header text-center">{t('shift.morning')}</th>
                            <th className="shift-header text-center">{t('shift.day')}</th>
                            <th className="shift-header text-center">{t('shift.night')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {weeklyTemplate.constraints.template.map(day => (
                            <tr key={day.date}>
                                <td className="text-center">
                                    <div>{t(`calendar.weekDays.${day.weekday}`)}</div>
                                    <small className="text-muted">{formatDate(day.date)}</small>
                                </td>
                                {['morning', 'day', 'night'].map(shiftType => {
                                    const shift = day.shifts.find(s => s.shift_type === shiftType);
                                    return shift ? (
                                        <td key={`${day.date}-${shiftType}`}
                                            className={getCellClass(day.date, shiftType)}
                                            onClick={() => handleCellClick(day.date, shiftType)}
                                        >
                                            {/* Empty cell */}
                                        </td>
                                    ) : (
                                        <td key={`${day.date}-${shiftType}`} className="text-center text-muted">
                                            -
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Submit Button */}
            {canEdit && !isSubmitted && (
                <div className="text-center mt-4">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-5"
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
        </Container>
    );
};

export default ConstraintsSchedule;