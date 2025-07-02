// frontend/src/features/admin-workplace-settings/ui/PositionModal/PositionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { createPosition, updatePosition } from '../../model/workplaceSlice';

import './PositionModal.css';

const PositionModal = ({ show, onHide, onSuccess, position, workSites, defaultSiteId }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        pos_name: '',
        site_id: '',
        profession: '',
        num_of_emp: 1
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const activeWorkSites = workSites.filter(site => site.is_active);
        if (position) {
            setFormData({
                pos_name: position.pos_name || '',
                site_id: position.site_id || '',
                profession: position.profession || '',
                num_of_emp: position.num_of_emp || 1
            });
        } else {
            setFormData({
                pos_name: '',
                site_id: defaultSiteId || (activeWorkSites.length > 0 ? activeWorkSites[0].site_id : ''),
                profession: '',
                num_of_emp: 1
            });
        }
        setErrors({});
    }, [position, workSites, defaultSiteId]);

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
                                    {workSites
                                        .filter(site => site.is_active)
                                        .map(site => (
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