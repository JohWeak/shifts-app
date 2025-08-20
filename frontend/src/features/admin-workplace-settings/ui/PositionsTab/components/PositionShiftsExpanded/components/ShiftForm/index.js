// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionShiftsExpanded/components/ShiftForm/index.js
import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Button,
    Row,
    Col,
    Alert,
    InputGroup
} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { createPositionShift, updatePositionShift } from '../../../../../../model/workplaceSlice';
import './ShiftForm.css';

const ShiftForm = ({ show, onHide, onSuccess, positionId, shift }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        shift_name: '',
        start_time: '',
        end_time: '',
        color: '#6c757d',
        sort_order: 0
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Предустановленные цвета для смен
    const presetColors = [
        { color: '#fbe9bd', name: 'Yellow' },
        { color: '#b4dbfb', name: 'Blue' },
        { color: '#fbc0c5', name: 'Pink' },
        { color: '#dafdcb', name: 'Green' },
        { color: '#fbaafb', name: 'Purple' },
        { color: '#96f6e5', name: 'Cyan' },
        { color: '#DEB887', name: 'Beige' }
    ];

    useEffect(() => {
        if (shift) {
            setFormData({
                shift_name: shift.shift_name || '',
                start_time: shift.start_time?.substring(0, 5) || '',
                end_time: shift.end_time?.substring(0, 5) || '',
                color: shift.color || '#6c757d',
                sort_order: shift.sort_order || 0
            });
        } else {
            setFormData({
                shift_name: '',
                start_time: '',
                end_time: '',
                color: '#6c757d',
                sort_order: 0
            });
        }
        setErrors({});
    }, [shift]);

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

        // Проверка, что время окончания после времени начала для однодневных смен
        if (formData.start_time && formData.end_time) {
            const [startHour, startMin] = formData.start_time.split(':').map(Number);
            const [endHour, endMin] = formData.end_time.split(':').map(Number);

            // Если смена заканчивается раньше, чем начинается, это ночная смена - это ок
            // Но если время одинаковое, это ошибка
            if (startHour === endHour && startMin === endMin) {
                newErrors.end_time = t('workplace.shifts.invalidTimeRange');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const calculateDuration = () => {
        if (!formData.start_time || !formData.end_time) return '';

        const [startHour, startMin] = formData.start_time.split(':').map(Number);
        const [endHour, endMin] = formData.end_time.split(':').map(Number);

        let duration;
        if (endHour >= startHour) {
            duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        } else {
            duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
        }

        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;

        return minutes > 0
            ? `${hours} ${t('common.hours')} ${minutes} ${t('common.minutes')}`
            : `${hours} ${t('common.hours')}`;
    };

    const suggestShiftName = () => {
        if (!formData.start_time) return;

        const hour = parseInt(formData.start_time.split(':')[0]);
        let suggestion = '';

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
            if (shift) {
                await dispatch(updatePositionShift({
                    shiftId: shift.id,
                    shiftData: formData
                })).unwrap();
            } else {
                await dispatch(createPositionShift({
                    positionId,
                    shiftData: formData
                })).unwrap();
            }

            onSuccess();
        } catch (error) {
            setErrors({
                submit: error || t('common.error')
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
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
                                        variant="outline-secondary"
                                        onClick={suggestShiftName}
                                        disabled={!formData.start_time}
                                        title={t('workplace.shifts.suggestName')}
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
                                <Form.Label>
                                    {t('workplace.shifts.startTime')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => handleChange('start_time', e.target.value)}
                                    isInvalid={!!errors.start_time}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.start_time}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('workplace.shifts.endTime')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => handleChange('end_time', e.target.value)}
                                    isInvalid={!!errors.end_time}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.end_time}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('workplace.shifts.duration')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={calculateDuration()}
                                    readOnly
                                    className="bg-light"
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
                                style={{ width: '60px', height: '40px' }}
                            />
                            <div className="color-presets d-flex gap-1">
                                {presetColors.map(preset => (
                                    <button
                                        key={preset.color}
                                        type="button"
                                        className={`color-preset ${formData.color === preset.color ? 'active' : ''}`}
                                        style={{ backgroundColor: preset.color }}
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

                    {formData.start_time && formData.end_time && (
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            {parseInt(formData.end_time) < parseInt(formData.start_time)
                                ? t('workplace.shifts.overnightShiftNotice')
                                : t('workplace.shifts.regularShiftNotice')
                            }
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