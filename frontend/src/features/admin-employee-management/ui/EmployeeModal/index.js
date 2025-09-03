// frontend/src/features/admin-employee-management/ui/EmployeeModal/index.js
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchWorkSites } from 'features/admin-schedule-management/model/scheduleSlice';
import { fetchPositions } from 'features/admin-workplace-settings/model/workplaceSlice';
import { citiesData, locationData } from 'shared/utils/locationData';

import './EmployeeModal.css';

const EmployeeModal = ({ show, onHide, onSave, employee }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    // Helper functions for location data
    const getCountries = () => {
        // Get current language from i18n context, fallback to 'en'
        const currentLang = localStorage.getItem('i18n_language') || 'en';
        return Object.keys(locationData[currentLang]?.countries || locationData.en.countries);
    };

    const getCountryDisplayName = (countryKey) => {
        const currentLang = localStorage.getItem('i18n_language') || 'en';
        return locationData[currentLang]?.countries[countryKey] || locationData.en.countries[countryKey] || countryKey;
    };

    const getCitiesForCountry = (countryKey) => {
        return citiesData[countryKey] || [];
    };

    const { workSites } = useSelector((state) => state.schedule || {});
    const { positions } = useSelector((state) => state.workplace || {});
    const { user } = useSelector((state) => state.auth);

    // Check if current user is super admin
    const isSuperAdmin = user && (user.emp_id === 1 || user.is_super_admin);

    // Check if this is a flexible employee (no work_site assigned) and user is not super admin
    const isFlexibleEmployee = employee && (employee.work_site_id === null || employee.work_site === null);
    const isFlexibleEditingBlocked = isFlexibleEmployee && !isSuperAdmin;

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        address: '',
        login: '',
        password: '',
        status: 'active',
        role: 'employee',
        default_position_id: '',
        work_site_id: 'any',
        admin_work_sites_scope: [],
        is_super_admin: false,
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [selectedWorkSite, setSelectedWorkSite] = useState('');
    const [availableCities, setAvailableCities] = useState([]);


    useEffect(() => {
        if (show) {
            if (!workSites || workSites.length === 0) {
                dispatch(fetchWorkSites());
            }
            if (!positions || positions.length === 0) {
                dispatch(fetchPositions());
            }
        }
    }, [show, workSites, positions, dispatch]);

    useEffect(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                country: employee.country || '',
                city: employee.city || '',
                address: employee.address || '',
                login: employee.login || '',
                password: '',
                status: employee.status || 'active',
                role: employee.role || 'employee',
                default_position_id: employee.default_position_id || '',
                work_site_id: employee.work_site_id || 'any',
                admin_work_sites_scope: employee.admin_work_sites_scope || [],
                is_super_admin: employee.is_super_admin || false,
            });
            setSelectedWorkSite(employee.work_site_id || 'any');
            if (employee.country) {
                setAvailableCities(getCitiesForCountry(employee.country));
            }
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                country: '',
                city: '',
                address: '',
                login: '',
                password: '',
                status: 'active',
                role: 'employee',
                default_position_id: '',
                work_site_id: 'any',
                admin_work_sites_scope: [],
                is_super_admin: false,
            });
            setSelectedWorkSite('any');
            setAvailableCities([]);
        }
        setErrors({});
    }, [employee]);

    // Filter positions based on the selected work site
    const getFilteredPositions = () => {
        if (selectedWorkSite === 'any') {
            // For 'any' work site, show unique position names from ACTIVE positions only
            const uniquePositions = [];
            const positionNames = new Set();

            positions
                .filter(pos => pos.is_active) // Add filter for active positions
                .forEach(pos => {
                    if (!positionNames.has(pos.pos_name)) {
                        positionNames.add(pos.pos_name);
                        uniquePositions.push({
                            pos_id: pos.pos_id,
                            pos_name: pos.pos_name,
                        });
                    }
                });

            return uniquePositions;
        } else {
            // Show ACTIVE positions for specific work site
            return positions.filter(pos =>
                pos.site_id === parseInt(selectedWorkSite) && pos.is_active,
            );
        }
    };
    const filteredPositions = getFilteredPositions();


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

        if (field === 'country') {
            setAvailableCities(getCitiesForCountry(value));
            setFormData(prev => ({ ...prev, city: '' })); // Reset city when country changes
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
        if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
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
            const { admin_work_sites_scope, is_super_admin, ...baseData } = formData;
            
            const dataToSave = {
                ...baseData,
                work_site_id: formData.work_site_id === 'any' ? null : formData.work_site_id,
            };

            // Only include admin fields if user is super admin
            if (isSuperAdmin) {
                dataToSave.admin_work_sites_scope = admin_work_sites_scope;
                dataToSave.is_super_admin = is_super_admin;
            }

            onSave(dataToSave);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            className="employee-modal"
        >
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`bi bi-person-${employee ? 'gear' : 'plus'} me-2`}></i>
                        {employee ? t('employee.editEmployee') : t('employee.addEmployee')}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* Personal Information */}
                    <Card className="mb-4">
                        <Card.Header className="">
                            <h6 className="mb-0">
                                <i className="bi bi-person me-2"></i>
                                {t('employee.personalInfo')}
                            </h6>
                        </Card.Header>
                        <Card.Body>
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
                                            disabled={isFlexibleEditingBlocked}
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
                                            disabled={isFlexibleEditingBlocked}
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
                                            disabled={isFlexibleEditingBlocked}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>

                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t('employee.phone')}</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            placeholder={t('employee.phonePlaceholder')}
                                            disabled={isFlexibleEditingBlocked}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t('employee.country')}</Form.Label>
                                        <Form.Select
                                            value={formData.country}
                                            onChange={(e) => handleChange('country', e.target.value)}
                                            disabled={isFlexibleEditingBlocked}
                                        >
                                            <option value="">{t('common.select')}</option>
                                            {getCountries().map((countryKey) => (
                                                <option key={countryKey} value={countryKey}>
                                                    {getCountryDisplayName(countryKey)}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t('employee.city')}</Form.Label>
                                        <Form.Select
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            disabled={!formData.country || isFlexibleEditingBlocked}
                                        >
                                            <option value="">{t('common.select')}</option>
                                            {availableCities.map((city) => (
                                                <option key={city} value={city}>
                                                    {city}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t('employee.address')}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            placeholder={t('employee.addressPlaceholder')}
                                            disabled={isFlexibleEditingBlocked}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Work Information */}
                    <Card className="mb-4">
                        <Card.Header className="">
                            <h6 className="mb-0">
                                <i className="bi bi-briefcase me-2"></i>
                                {t('employee.workInfo')}
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t('workSite.workSite')}</Form.Label>
                                        <Form.Select
                                            value={formData.work_site_id}
                                            onChange={(e) => handleChange('work_site_id', e.target.value)}
                                            disabled={isFlexibleEditingBlocked}
                                        >
                                            <option value="any">{t('employee.commonWorkSite')}</option>
                                            {workSites
                                                ?.filter(site => site.is_active)
                                                .map((site) => (
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

                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t('employee.defaultPosition')}</Form.Label>
                                        <Form.Select
                                            value={formData.default_position_id}
                                            onChange={(e) => handleChange('default_position_id', e.target.value)}
                                            disabled={!selectedWorkSite || filteredPositions.length === 0 || isFlexibleEditingBlocked}
                                        >
                                            <option value="">{t('employee.noPosition')}</option>
                                            {filteredPositions.map((position) => (
                                                <option key={position.pos_id} value={position.pos_id}>
                                                    {position.pos_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {selectedWorkSite && filteredPositions.length === 0 && (
                                            <Form.Text className="text-muted">
                                                {t('employee.noPositionsForSite')}
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Administrative Access - Only visible for admin role and to super admin */}
                    {formData.role === 'admin' && isSuperAdmin && (
                        <Card className="mb-4">
                            <Card.Header className="">
                                <h6 className="mb-0">
                                    <i className="bi bi-shield-check me-2"></i>
                                    {t('admin.administrativeAccess')}
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('admin.accessibleWorkSites')}</Form.Label>
                                            <div className="form-check-list">
                                                {workSites
                                                    ?.filter(site => site.is_active)
                                                    .map((site) => (
                                                        <Form.Check
                                                            key={site.site_id}
                                                            type="checkbox"
                                                            id={`worksite-${site.site_id}`}
                                                            label={site.site_name}
                                                            checked={formData.admin_work_sites_scope.includes(site.site_id)}
                                                            onChange={(e) => {
                                                                const siteId = site.site_id;
                                                                const currentScope = formData.admin_work_sites_scope || [];
                                                                let newScope;

                                                                if (e.target.checked) {
                                                                    newScope = [...currentScope, siteId];
                                                                } else {
                                                                    newScope = currentScope.filter(id => id !== siteId);
                                                                }

                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    admin_work_sites_scope: newScope,
                                                                }));
                                                            }}
                                                            className="mb-2"
                                                        />
                                                    ))}
                                            </div>
                                            <Form.Text className="text-muted">
                                                {t('admin.accessibleWorkSitesHelp')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {isSuperAdmin && (
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="is_super_admin"
                                                    label={
                                                        <span>
                                                            <strong>{t('admin.grantSuperAdminPrivileges')}</strong>
                                                            <br />
                                                            <small className="text-muted">
                                                                {t('admin.superAdminHelp')}
                                                            </small>
                                                        </span>
                                                    }
                                                    checked={formData.is_super_admin}
                                                    onChange={(e) => handleChange('is_super_admin', e.target.checked)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* System Information - Hidden for flexible employees when non-super admin */}
                    {!isFlexibleEditingBlocked && (
                        <Card className="mb-4">
                            <Card.Header className="">
                                <h6 className="mb-0">
                                    <i className="bi bi-gear me-2"></i>
                                    {t('employee.systemInfo')}
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
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
                                                disabled={isFlexibleEditingBlocked}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.login}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

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
                                                    disabled={isFlexibleEditingBlocked}
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
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('employee.status')}</Form.Label>
                                            <Form.Select
                                                value={formData.status}
                                                onChange={(e) => handleChange('status', e.target.value)}
                                                disabled={isFlexibleEditingBlocked}
                                            >
                                                <option value="active">{t('status.active')}</option>
                                                <option value="inactive">{t('status.inactive')}</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('employee.role')}</Form.Label>
                                            <Form.Select
                                                value={formData.role}
                                                onChange={(e) => handleChange('role', e.target.value)}
                                                disabled={(!isSuperAdmin && formData.role === 'admin') || isFlexibleEditingBlocked}
                                            >
                                                <option value="employee">{t('role.employee')}</option>
                                                {isSuperAdmin && (
                                                    <option value="admin">{t('role.admin')}</option>
                                                )}
                                            </Form.Select>
                                            {!isSuperAdmin && formData.role === 'admin' && (
                                                <Form.Text className="text-muted">
                                                    {t('admin.onlySuperAdminCanChangeRole')}
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {employee && (
                        <Alert variant={isFlexibleEditingBlocked ? "warning" : "info"} className="mt-3">
                            <i className={`bi bi-${isFlexibleEditingBlocked ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
                            {isFlexibleEditingBlocked 
                                ? t('admin.flexibleEmployeeEditingRestricted', 'Only super administrators can edit flexible employees (employees not assigned to any work site).')
                                : t('employee.editInfo')
                            }
                        </Alert>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" type="submit" disabled={isFlexibleEditingBlocked}>
                        <i className={`bi bi-${employee ? 'check' : 'plus'}-circle me-1`}></i>
                        {employee ? t('common.save') : t('common.create')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default EmployeeModal;