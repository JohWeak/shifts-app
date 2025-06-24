// frontend/src/features/admin-workplace-settings/ui/PositionModal/PositionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { createPosition, updatePosition } from '../../model/workplaceSlice';

import './PositionModal.css';

const PositionModal = ({ show, onHide, onSuccess, position, workSites }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        pos_name: '',
        site_id: '',
        profession: '',
        num_of_emp: 1,
        required_roles: []
    });

    const [newRole, setNewRole] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (position) {
            setFormData({
                pos_name: position.pos_name || '',
                site_id: position.site_id || '',
                profession: position.profession || '',
                num_of_emp: position.num_of_emp || 1,
                required_roles: position.required_roles || []
            });
        } else {
            setFormData({
                pos_name: '',
                site_id: workSites.length > 0 ? workSites[0].site_id : '',
                profession: '',
                num_of_emp: 1,
                required_roles: []
            });
        }
        setErrors({});
        setNewRole('');
    }, [position, workSites]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.pos_name.trim()) {
            newErrors.pos_name = t('validation.required');
        }

        if (!formData.site_id) {
            newErrors.site_id = t('validation.required');
        }

        if (formData.num_of_emp < 1) {
            newErrors.num_of_emp = t('workplace.positions.minStaffError');
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

    const handleAddRole = () => {
        if (newRole.trim() && !formData.required_roles.includes(newRole.trim())) {
            handleChange('required_roles', [...formData.required_roles, newRole.trim()]);
            setNewRole('');
        }
    };

    const handleRemoveRole = (roleToRemove) => {
        handleChange('required_roles', formData.required_roles.filter(role => role !== roleToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            if (position) {
                await dispatch(updatePosition({
                    id: position.pos_id,
                    ...formData
                })).unwrap();
            } else {
                await dispatch(createPosition(formData)).unwrap();
            }
            onSuccess();
        } catch (error) {
            setErrors({ submit: error.message || t('common.error') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {position
                        ? t('workplace.positions.edit')
                        : t('workplace.positions.add')
                    }
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
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('workplace.positions.name')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.pos_name}
                                    onChange={(e) => handleChange('pos_name', e.target.value)}
                                    isInvalid={!!errors.pos_name}
                                    placeholder={t('workplace.positions.namePlaceholder')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.pos_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('workplace.worksites.title')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={formData.site_id}
                                    onChange={(e) => handleChange('site_id', e.target.value)}
                                    isInvalid={!!errors.site_id}
                                >
                                    {workSites.map(site => (
                                        <option key={site.site_id} value={site.site_id}>
                                            {site.site_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.site_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('workplace.positions.profession')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.profession}
                                    onChange={(e) => handleChange('profession', e.target.value)}
                                    placeholder={t('workplace.positions.professionPlaceholder')}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t('workplace.positions.defaultStaffCount')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={formData.num_of_emp}
                                    onChange={(e) => handleChange('num_of_emp', parseInt(e.target.value) || 1)}
                                    isInvalid={!!errors.num_of_emp}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.num_of_emp}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    {t('workplace.positions.defaultStaffHint')}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('workplace.positions.requiredRoles')}</Form.Label>
                        <div className="d-flex gap-2 mb-2">
                            <Form.Control
                                type="text"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                placeholder={t('workplace.positions.addRolePlaceholder')}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                            />
                            <Button
                                variant="outline-primary"
                                onClick={handleAddRole}
                                disabled={!newRole.trim()}
                            >
                                <i className="bi bi-plus"></i>
                            </Button>
                        </div>
                        <div className="roles-container">
                            {formData.required_roles.map((role, index) => (
                                <Badge
                                    key={index}
                                    bg="secondary"
                                    className="role-badge"
                                >
                                    {role}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0 ms-1 text-white"
                                        onClick={() => handleRemoveRole(role)}
                                    >
                                        <i className="bi bi-x"></i>
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    </Form.Group>
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

export default PositionModal;