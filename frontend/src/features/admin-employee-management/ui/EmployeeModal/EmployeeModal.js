// frontend/src/features/admin-employee-management/ui/EmployeeModal/EmployeeModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchWorkSites } from 'features/admin-schedule-management/model/scheduleSlice';
import './EmployeeModal.css';

const EmployeeModal = ({ show, onHide, onSave, employee }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { systemSettings } = useSelector((state) => state.settings || {});
    const { workSites } = useSelector((state) => state.schedule || {});
    const positions = systemSettings?.positions || [];

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        login: '',
        password: '',
        status: 'active',
        role: 'employee',
        default_position_id: '',
        work_site_id: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [selectedWorkSite, setSelectedWorkSite] = useState('');

    useEffect(() => {
        if (show && (!workSites || workSites.length === 0)) {
            dispatch(fetchWorkSites());
        }
    }, [show, dispatch, workSites]);

    useEffect(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                login: employee.login || '',
                password: '',
                status: employee.status || 'active',
                role: employee.role || 'employee',
                default_position_id: employee.default_position_id || '',
                work_site_id: employee.work_site_id || ''
            });
            setSelectedWorkSite(employee.work_site_id || '');
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                login: '',
                password: '',
                status: 'active',
                role: 'employee',
                default_position_id: '',
                work_site_id: ''
            });
            setSelectedWorkSite('');
        }
        setErrors({});
    }, [employee]);

    // Filter positions based on selected work site
    const filteredPositions = selectedWorkSite && selectedWorkSite !== 'any'
        ? positions.filter(pos => pos.site_id === parseInt(selectedWorkSite))
        : positions;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'work_site_id') {
            setSelectedWorkSite(value);
            if (value && value !== 'any' && formData.default_position_id) {
                const position = positions.find(p => p.pos_id === parseInt(formData.default_position_id));
                if (position && position.site_id !== parseInt(value)) {
                    setFormData(prev => ({ ...prev, default_position_id: '' }));
                }
            }
        }

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
        // Email is optional now
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('validation.invalidEmail');
        }
        // Login is required
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
        if (validateForm()) {
            const dataToSave = {
                ...formData,
                work_site_id: formData.work_site_id === 'any' ? null : formData.work_site_id
            };
            onSave(dataToSave);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" className="employee-modal">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`bi bi-person-${employee ? 'gear' : 'plus'} me-2`}></i>
                        {employee ? t('employee.editEmployee') : t('employee.addEmployee')}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('employee.firstName')} <span className="text-danger">*</span>
                                </Form.Label>
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
                                <Form.Label>
                                    {t('employee.lastName')} <span className="text-danger">*</span>
                                </Form.Label>
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
                                <Form.Label>{t('employee.email')}</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    isInvalid={!!errors.email}
                                    placeholder={t('employee.emailOptional')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('employee.login')} <span className="text-danger">*</span>
                                </Form.Label>
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
                                    {!employee && <span className="text-danger">*</span>}
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
                                        type="button"
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
                                <Form.Label>{t('workSite.workSite')}</Form.Label>
                                <Form.Select
                                    value={formData.work_site_id}
                                    onChange={(e) => handleChange('work_site_id', e.target.value)}
                                >
                                    <option value="">{t('common.select')}</option>
                                    <option value="any">{t('employee.commonWorkSite')}</option>
                                    {workSites?.map((site) => (
                                        <option key={site.site_id} value={site.site_id}>
                                            {site.site_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    {t('employee.workSiteHelp')}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('employee.defaultPosition')}</Form.Label>
                                <Form.Select
                                    value={formData.default_position_id}
                                    onChange={(e) => handleChange('default_position_id', e.target.value)}
                                    disabled={!selectedWorkSite || filteredPositions.length === 0}
                                >
                                    <option value="">{t('employee.noPosition')}</option>
                                    {filteredPositions.map((position) => (
                                        <option key={position.pos_id} value={position.pos_id}>
                                            {position.pos_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                {selectedWorkSite && selectedWorkSite !== 'any' && filteredPositions.length === 0 && (
                                    <Form.Text className="text-muted">
                                        {t('employee.noPositionsForSite')}
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>

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
                    </Row>

                    <Row>
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