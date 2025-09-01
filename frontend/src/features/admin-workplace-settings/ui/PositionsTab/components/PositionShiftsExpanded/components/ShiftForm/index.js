// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionShiftsExpanded/components/ShiftForm/index.js
import React, {useEffect, useState} from 'react';
import {Alert, Badge, Button, Col, Form, InputGroup, Modal, Row} from 'react-bootstrap';
import {TimePicker} from 'react-accessible-time-picker';
import {useDispatch} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {createPositionShift, updatePositionShift} from '../../../../../../model/workplaceSlice';

import './ShiftForm.css';

const ShiftForm = ({show, onHide, onSuccess, positionId, shift, regularShifts = [], dragContext = null}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        shift_name: '',
        start_time: '',
        end_time: '',
        color: '#6c757d',
        sort_order: 0,
        is_flexible: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [spanningShifts, setSpanningShifts] = useState([]);

    const presetColors = [
        {color: '#fbe9bd', name: 'Yellow'},
        {color: '#b4dbfb', name: 'Blue'},
        {color: '#fbc0c5', name: 'Pink'},
        {color: '#dafdcb', name: 'Green'},
        {color: '#fbaafb', name: 'Purple'},
        {color: '#96f6e5', name: 'Cyan'},
        {color: '#DEB887', name: 'Beige'}
    ];

    useEffect(() => {
        if (shift) {
            setFormData({
                shift_name: shift.shift_name || '',
                start_time: shift.start_time?.substring(0, 5) || '',
                end_time: shift.end_time?.substring(0, 5) || '',
                color: shift.color || '#6c757d',
                sort_order: shift.sort_order || 0,
                is_flexible: shift.is_flexible || false
            });

            // Set spanning shifts for existing flexible shift
            if (shift.is_flexible && shift.spans_shifts) {
                setSpanningShifts(shift.spans_shifts);
            }
        } else {
            // Pre-fill from drag context if available
            const baseData = {
                shift_name: '',
                start_time: '',
                end_time: '',
                color: '#6c757d',
                sort_order: 0,
                is_flexible: false
            };

            if (dragContext) {
                baseData.is_flexible = true;
                baseData.start_time = dragContext.start_time || '';
                baseData.end_time = dragContext.end_time || '';
                baseData.shift_name = `${t('workplace.shifts.flexibleShift')} ${dragContext.start_time}-${dragContext.end_time}`;
            }

            setFormData(baseData);
        }
        setErrors({});
    }, [shift, dragContext, t]);

    // Helper function to calculate duration
    const calculateDuration = () => {
        if (!formData.start_time || !formData.end_time) return '';

        const [startHour, startMin] = formData.start_time.split(':').map(Number);
        const [endHour, endMin] = formData.end_time.split(':').map(Number);

        let startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;

        // Handle overnight shifts
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        if (minutes === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${minutes}m`;
    };

    // Calculate spanning shifts when times change
    useEffect(() => {
        if (formData.is_flexible && formData.start_time && formData.end_time && regularShifts.length > 0) {
            calculateSpanningShifts();
        }
    }, [formData.start_time, formData.end_time, formData.is_flexible, regularShifts]);

    const hasTimeOverlap = (start1, end1, start2, end2) => {
        const toMinutes = (timeStr) => {
            if (!timeStr || typeof timeStr !== 'string') return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return 0;
            return hours * 60 + minutes;
        };

        let flex_start = toMinutes(start1);
        let flex_end = toMinutes(end1);
        let shift_start = toMinutes(start2);
        let shift_end = toMinutes(end2);

        // Handle overnight shifts by expanding to handle both same-day and cross-day scenarios
        const checkOverlap = (fs, fe, ss, se) => {
            return Math.max(fs, ss) < Math.min(fe, se);
        };

        // Case 1: Both are regular shifts (no overnight)
        if (flex_end >= flex_start && shift_end >= shift_start) {
            return checkOverlap(flex_start, flex_end, shift_start, shift_end);
        }

        // Case 2: Flexible shift is overnight, regular shift is not
        if (flex_end < flex_start && shift_end >= shift_start) {
            return checkOverlap(flex_start, flex_start + 24 * 60, shift_start, shift_end) ||
                checkOverlap(0, flex_end, shift_start, shift_end);
        }

        // Case 3: Regular shift is overnight, flexible shift is not
        if (flex_end >= flex_start && shift_end < shift_start) {
            return checkOverlap(flex_start, flex_end, shift_start, shift_start + 24 * 60) ||
                checkOverlap(flex_start, flex_end, 0, shift_end);
        }

        // Case 4: Both are overnight shifts
        if (flex_end < flex_start && shift_end < shift_start) {
            return checkOverlap(flex_start, flex_start + 24 * 60, shift_start, shift_start + 24 * 60) ||
                checkOverlap(0, flex_end, 0, shift_end) ||
                checkOverlap(flex_start, flex_start + 24 * 60, 0, shift_end) ||
                checkOverlap(0, flex_end, shift_start, shift_start + 24 * 60);
        }

        return false;
    };

    const calculateSpanningShifts = () => {
        const spans = [];

        regularShifts.forEach(regShift => {
            if (!regShift.is_flexible && regShift.is_active !== false) {
                const regStart = regShift.start_time?.substring(0, 5) || regShift.start_time;
                const regEnd = regShift.end_time?.substring(0, 5) || regShift.end_time;

                if (hasTimeOverlap(formData.start_time, formData.end_time, regStart, regEnd)) {
                    spans.push(regShift.id);
                }
            }
        });

        setSpanningShifts(spans);
    };

    const getSpanningShiftDetails = () => {
        return regularShifts.filter(shift =>
            spanningShifts.includes(shift.id) && !shift.is_flexible
        );
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.shift_name.trim()) {
            newErrors.shift_name = t('validation.required');
        }

        if (!formData.start_time) {
            newErrors.start_time = t('validation.required');
        }

        if (!formData.end_time) {
            newErrors.end_time = t('validation.required');
        }

        // Verification that the end time is not the same as start time
        if (formData.start_time && formData.end_time) {
            const [startHour, startMin] = formData.start_time.split(':').map(Number);
            const [endHour, endMin] = formData.end_time.split(':').map(Number);

            if (startHour === endHour && startMin === endMin) {
                newErrors.end_time = t('workplace.shifts.invalidTimeRange');
            }

            // Validate flexible shift specific constraints
            if (formData.is_flexible) {
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                let duration;
                if (endMinutes >= startMinutes) {
                    duration = endMinutes - startMinutes;
                } else {
                    duration = (24 * 60 - startMinutes) + endMinutes;
                }

                const durationHours = duration / 60;

                // Validate minimum duration (1 hour)
                if (durationHours < 1) {
                    newErrors.end_time = t('workplace.shifts.flexibleMinDuration');
                }

                // Validate maximum duration (12 hours)
                if (durationHours > 12) {
                    newErrors.end_time = t('workplace.shifts.flexibleMaxDuration');
                }

                // Validate that flexible shift spans at least one regular shift
                if (spanningShifts.length === 0) {
                    newErrors.end_time = t('workplace.shifts.flexibleMustSpanShifts');
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({...prev, [field]: value}));
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: null}));
        }

        // Clear spanning shifts when switching from flexible to regular
        if (field === 'is_flexible' && !value) {
            setSpanningShifts([]);
        }
    };
    const handleTimeChange = (field, newValue) => {
        if (typeof newValue !== 'object' || !newValue) {
            if (newValue === '') {
                handleChange(field, '');
            }
            return;
        }

        const currentTime = formData[field] || '00:00';
        const [currentHour, currentMinute] = currentTime.split(':');

        const newHour = newValue.hour || currentHour;
        const newMinute = newValue.minute || currentMinute;

        const formattedTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;

        handleChange(field, formattedTime);
    };

    const timeStringToObject = (timeString) => {
        if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
            return {hour: '', minute: ''};
        }
        const [hour, minute] = timeString.split(':');
        return {hour, minute};
    };


    const suggestShiftName = () => {
        if (!formData.start_time) return;
        const startStr = String(formData.start_time);
        const hour = parseInt(startStr.split(':')[0]);
        let suggestion;
        if (hour >= 5 && hour < 12) {
            suggestion = t('workplace.shifts.morningShift');
        } else if (hour >= 12 && hour < 17) {
            suggestion = t('workplace.shifts.afternoonShift');
        } else if (hour >= 17 && hour < 22) {
            suggestion = t('workplace.shifts.eveningShift');
        } else {
            suggestion = t('workplace.shifts.nightShift');
        }

        handleChange('shift_name', suggestion);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const shiftData = {
                ...formData,
                ...(formData.is_flexible && {spans_shifts: spanningShifts})
            };

            if (shift) {
                if (shift.is_flexible || formData.is_flexible) {
                    // Use flexible shift endpoints for flexible shifts
                    await dispatch(updatePositionShift({
                        shiftId: shift.id,
                        shiftData,
                        isFlexible: formData.is_flexible
                    })).unwrap();
                } else {
                    await dispatch(updatePositionShift({
                        shiftId: shift.id,
                        shiftData
                    })).unwrap();
                }
            } else {
                await dispatch(createPositionShift({
                    positionId,
                    shiftData,
                    isFlexible: formData.is_flexible
                })).unwrap();
            }
            onSuccess();
        } catch (error) {
            const errorMessage = error.message || t('common.error');
            setErrors({
                submit: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            enforceFocus={false}
            className="workplace-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {shift ? t('workplace.shifts.editShift') : t('workplace.shifts.addShift')}
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {errors.submit && (
                        <Alert variant="danger" dismissible onClose={() => setErrors({})}>
                            {errors.submit}
                        </Alert>
                    )}

                    {/* Flexible Shift Toggle */}
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Check
                                    type="switch"
                                    id="flexible-shift-toggle"
                                    label={t('workplace.shifts.flexibleShift')}
                                    checked={formData.is_flexible}
                                    onChange={(e) => handleChange('is_flexible', e.target.checked)}
                                    disabled={shift && !shift.is_flexible} // Prevent converting regular to flexible for existing shifts
                                />
                                <Form.Text className="text-muted">
                                    {t('workplace.shifts.flexibleShiftHint')}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={8}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('workplace.shifts.name')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        value={formData.shift_name}
                                        onChange={(e) => handleChange('shift_name', e.target.value)}
                                        isInvalid={!!errors.shift_name}
                                        placeholder={t('workplace.shifts.namePlaceholder')}
                                    />
                                    <Button
                                        variant="warning"
                                        onClick={suggestShiftName}
                                        disabled={!formData.start_time}
                                        title={t('workplace.shifts.suggestName')}
                                        className="rounded-1"
                                    >
                                        <i className="bi bi-lightbulb"></i>
                                    </Button>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.shift_name}
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('workplace.shifts.sortOrder')}</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    value={formData.sort_order}
                                    onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
                                />
                                <Form.Text className="text-muted">
                                    {t('workplace.shifts.sortOrderHint')}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <TimePicker
                                    label={t('workplace.shifts.startTime')}
                                    value={timeStringToObject(formData.start_time)}
                                    onChange={(time) => handleTimeChange('start_time', time)}
                                    className={errors.start_time ? 'is-invalid' : ''}
                                    is24Hour={true}
                                />

                                {errors.start_time && (
                                    <div className="invalid-feedback d-block">
                                        {errors.start_time}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <TimePicker
                                    label={t('workplace.shifts.endTime')}
                                    value={timeStringToObject(formData.end_time)}
                                    onChange={(time) => handleTimeChange('end_time', time)}
                                    className={errors.end_time ? 'is-invalid' : ''}
                                    is24Hour={true}
                                />
                                {errors.end_time && (
                                    <div className="invalid-feedback d-block">
                                        {errors.end_time}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('workplace.shifts.duration')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={calculateDuration()}
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('workplace.shifts.color')}</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Control
                                type="color"
                                value={formData.color}
                                onChange={(e) => handleChange('color', e.target.value)}
                                style={{width: '60px', height: '40px'}}
                            />
                            <div className="color-presets d-flex gap-1">
                                {presetColors.map(preset => (
                                    <button
                                        key={preset.color}
                                        type="button"
                                        className={`color-preset ${formData.color === preset.color ? 'active' : ''}`}
                                        style={{backgroundColor: preset.color}}
                                        onClick={() => handleChange('color', preset.color)}
                                        title={preset.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <Form.Text className="text-muted">
                            {t('workplace.shifts.colorHint')}
                        </Form.Text>
                    </Form.Group>

                    {/* Spanning Shifts Preview for Flexible Shifts */}
                    {formData.is_flexible && formData.start_time && formData.end_time && (
                        <Alert variant={spanningShifts.length > 0 ? "success" : "warning"} className="mt-3">
                            <div className="d-flex align-items-center mb-2">
                                <i className={`bi ${spanningShifts.length > 0 ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                                <strong>
                                    {spanningShifts.length > 0
                                        ? t('workplace.shifts.spansShifts', {count: spanningShifts.length})
                                        : t('workplace.shifts.noSpansShifts')
                                    }
                                </strong>
                            </div>

                            {spanningShifts.length > 0 ? (
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                    {getSpanningShiftDetails().map(shift => (
                                        <Badge
                                            key={shift.id}
                                            bg="light"
                                            text="dark"
                                            className="d-flex align-items-center gap-1"
                                        >
                                            <div
                                                className="rounded-circle"
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    backgroundColor: shift.color || '#6c757d'
                                                }}
                                            />
                                            {shift.shift_name} ({shift.start_time?.substring(0, 5)}-{shift.end_time?.substring(0, 5)})
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2">
                                    {t('workplace.shifts.flexibleMustOverlap')}
                                </div>
                            )}
                        </Alert>
                    )}

                    {/* Duration and Cross-day Notice */}
                    {formData.start_time && formData.end_time && (
                        <Alert variant="info" className="mt-3">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-info-circle me-2"></i>
                                <div>
                                    <strong>{t('workplace.shifts.duration')}: {calculateDuration()}</strong>
                                    {parseInt(formData.end_time.split(':')[0]) < parseInt(formData.start_time.split(':')[0]) && (
                                        <div className="mt-1 text-muted">
                                            <i className="bi bi-moon me-1"></i>
                                            {t('workplace.shifts.overnightShiftNotice')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Alert>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? t('common.saving') : t('common.save')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ShiftForm;