// frontend/src/features/admin-workplace-settings/ui/WorkSiteModal/WorkSiteModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { createWorkSite, updateWorkSite } from '../../model/workplaceSlice';

import './WorkSiteModal.css';

const WorkSiteModal = ({ show, onHide, onSuccess, site }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        site_name: '',
        address: '',
        phone: '',
        timezone: 'Asia/Jerusalem',
        is_active: true
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (site) {
            setFormData({
                site_name: site.site_name || '',
                address: site.address || '',
                phone: site.phone || '',
                timezone: site.timezone || 'Asia/Jerusalem',
                is_active: site.is_active !== undefined ? site.is_active : true
            });
        } else {
            setFormData({
                site_name: '',
                address: '',
                phone: '',
                timezone: 'Asia/Jerusalem',
                is_active: true
            });
        }
        setErrors({});
    }, [site]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.site_name.trim()) {
            newErrors.site_name = t('validation.required');
        }

        // Валидация телефона только если он заполнен
        if (formData.phone && formData.phone.trim()) {
            if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
                newErrors.phone = t('validation.invalidPhone');
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            if (site) {
                await dispatch(updateWorkSite({
                    id: site.site_id,
                    ...formData
                })).unwrap();
            } else {
                await dispatch(createWorkSite(formData)).unwrap();
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
                    {site
                        ? t('workplace.worksites.edit')
                        : t('workplace.worksites.add')
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
                                    {t('workplace.worksites.name')}
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.site_name}
                                    onChange={(e) => handleChange('site_name', e.target.value)}
                                    isInvalid={!!errors.site_name}
                                    placeholder={t('workplace.worksites.namePlaceholder')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.site_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('workplace.worksites.phone')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    isInvalid={!!errors.phone}
                                    placeholder="+972-XX-XXXXXXX"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('workplace.worksites.address')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder={t('workplace.worksites.addressPlaceholder')}
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('workplace.worksites.timezone')}</Form.Label>
                                <Form.Select
                                    value={formData.timezone}
                                    onChange={(e) => handleChange('timezone', e.target.value)}
                                >
                                    <option value="Asia/Jerusalem">Asia/Jerusalem (IST)</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common.status')}</Form.Label>
                                <Form.Check
                                    type="switch"
                                    id="is_active"
                                    label={formData.is_active
                                        ? t('workplace.worksites.active')
                                        : t('workplace.worksites.inactive')
                                    }
                                    checked={formData.is_active}
                                    onChange={(e) => handleChange('is_active', e.target.checked)}
                                />
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

export default WorkSiteModal;