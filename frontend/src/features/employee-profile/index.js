// frontend/src/features/employee-profile/index.js
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, FormGroup, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader';
import { loadProfile, updateProfile } from './model/profileSlice';
import './index.css';

const EmployeeProfile = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { user, loading, error, success } = useSelector(state => state.profile);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        receive_schedule_emails: false,
    });

    useEffect(() => {
        dispatch(loadProfile());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                receive_schedule_emails: user.receive_schedule_emails || false,
            });
        }
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(updateProfile(formData));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    return (
        <div className="employee-profile">
            <PageHeader
                title={t('profile.title')}
                subtitle={t('profile.subtitle')}
            />

            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{t('profile.updateSuccess')}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('profile.firstName')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('profile.lastName')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('profile.email')}</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('profile.phone')}</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Card className="mb-3">
                                    <Card.Body>
                                        <FormGroup>
                                            <Form.Label className="text-muted">
                                                {t('profile.notifications.title')}
                                            </Form.Label>
                                            <Form.Check
                                                type="switch"
                                                className="mb-2"
                                                id="receive_schedule_emails"
                                                name="receive_schedule_emails"
                                                label={t('profile.notifications.receiveScheduleEmails')}
                                                checked={formData.receive_schedule_emails}
                                                onChange={handleChange}
                                            />
                                        </FormGroup>
                                        <Form.Text className="text-muted">
                                            {t('profile.notifications.scheduleEmailsDescription')}
                                        </Form.Text>

                                    </Card.Body>
                                </Card>

                                <div className="d-grid gap-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                    >
                                        {loading ? t('common.saving') : t('common.save')}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default EmployeeProfile;