// frontend/src/features/admin-employee-management/ui/EmployeeModal/EmployeeModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './EmployeeModal.css';

const EmployeeModal = ({ show, onHide, onSave, employee }) => {
    const { t } = useI18n();
    const { positions } = useSelector((state) => state.settings);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        login: '',
        password: '',
        status: 'active',
        role: 'employee',
        default_position_id: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                login: employee.login || '',
                password: '', // Don't populate password for editing
                status: employee.status || 'active',
                role: employee.role || 'employee',
                default_position_id: employee.default_position_id || ''
            });
        } else {
            // Reset form for new employee
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                login: '',
                password: '',
                status: 'active',
                role: 'employee',
                default_position_id: ''
            });
        }
        setErrors({});
    }, [employee]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = t('validation.required');
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = t('validation.required');
        }
        if (!formData.email.trim()) {
            newErrors.email = t('validation.required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('validation.invalidEmail');
        }
        if (!formData.login.trim()) {
            newErrors.login = t('validation.required');
        }
        if (!employee && !formData.password.trim()) {
            newErrors.password = t('validation.required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Don't send empty password when editing
        const dataToSend = { ...formData };
        if (employee && !dataToSend.password) {
            delete dataToSend.password;
        }

        onSave(dataToSend);
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            className="employee-modal"
        >
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    <i className={`bi bi-${employee ? 'pencil' : 'person-plus'} me-2`}></i>
                    {employee ? t('employee.edit') : t('employee.addNew')}
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.firstName')} *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                    isInvalid={!!errors.first_name}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.first_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.lastName')} *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                    isInvalid={!!errors.last_name}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.last_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.email')} *</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    isInvalid={!!errors.email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.login')} *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.login}
                                    onChange={(e) => handleChange('login', e.target.value)}
                                    isInvalid={!!errors.login}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.login}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('employee.password')}
                                    {!employee && ' *'}
                                </Form.Label>
                                <div className="input-group">
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        isInvalid={!!errors.password}
                                        placeholder={employee ? t('employee.leaveEmptyToKeep') : ''}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                    </Button>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                    </Form.Control.Feedback>
                                </div>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.defaultPosition')}</Form.Label>
                                <Form.Select
                                    value={formData.default_position_id}
                                    onChange={(e) => handleChange('default_position_id', e.target.value)}
                                >
                                    <option value="">{t('employee.noPosition')}</option>
                                    {positions?.map((position) => (
                                        <option key={position.pos_id} value={position.pos_id}>
                                            {position.pos_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.status')}</Form.Label>
                                <Form.Select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    <option value="active">{t('status.active')}</option>
                                    <option value="inactive">{t('status.inactive')}</option>
                                    {formData.role === 'admin' && (
                                        <option value="admin">{t('common.admin')}</option>
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.role')}</Form.Label>
                                <Form.Select
                                    value={formData.role}
                                    onChange={(e) => handleChange('role', e.target.value)}
                                >
                                    <option value="employee">{t('role.employee')}</option>
                                    <option value="admin">{t('role.admin')}</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {employee && (
                        <Alert variant="info" className="mt-3">
                            <i className="bi bi-info-circle me-2"></i>
                            {t('employee.editInfo')}
                        </Alert>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" type="submit">
                        <i className={`bi bi-${employee ? 'check' : 'plus'}-circle me-2`}></i>
                        {employee ? t('common.save') : t('common.create')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default EmployeeModal;