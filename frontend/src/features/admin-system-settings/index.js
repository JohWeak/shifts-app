import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, Col, Container, Form, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchSystemSettings, updateLocalSettings, updateSystemSettings } from './model/settingsSlice';
import { addNotification } from '../../app/model/notificationsSlice';
import { motion } from 'motion/react';

import './index.css';

const SystemSettings = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { systemSettings, loading, error } = useSelector(state => state.settings);

    const [localSettings, setLocalSettings] = useState(systemSettings);
    const [activeTab, setActiveTab] = useState('schedule');

    useEffect(() => {
        dispatch(fetchSystemSettings()).then((result) => {
            if (fetchSystemSettings.rejected.match(result)) {
                dispatch(addNotification({
                    message: t('settings.fetchError', 'Failed to load settings'),
                    variant: 'danger',
                }));
            }
        });
    }, [dispatch, t]);

    useEffect(() => {
        if (systemSettings && Object.keys(systemSettings).length > 0) {
            setLocalSettings(systemSettings);
        }
    }, [systemSettings]);

    const handleChange = (field, value) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            // Оптимистично обновляем Redux state сразу
            dispatch(updateLocalSettings(localSettings));

            // Отправляем на сервер
            const result = await dispatch(updateSystemSettings(localSettings));

            if (updateSystemSettings.fulfilled.match(result)) {
                dispatch(addNotification({
                    message: t('settings.saveSuccess', 'Settings saved successfully'),
                    variant: 'success',
                }));
            } else {
                // Если ошибка, откатываем изменения
                setLocalSettings(systemSettings);
                dispatch(addNotification({
                    message: t('settings.saveError', 'Failed to save settings'),
                    variant: 'danger',
                }));
            }
        } catch (error) {
            // Откатываем изменения при ошибке
            setLocalSettings(systemSettings);
            dispatch(addNotification({
                message: t('settings.saveError', 'Failed to save settings'),
                variant: 'danger',
            }));
        }
    };

    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(systemSettings);

    if (loading === 'pending' && localSettings.weekStartDay === undefined) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" role="status" aria-label="Loading..." />
            </Container>
        );
    }

    const settingsNavItems = [
        {
            key: 'schedule',
            label: t('settings.scheduleSettings'),
            icon: 'calendar-week',
            description: t('settings.scheduleSettingsDesc'),
        },
        {
            key: 'constraints',
            label: t('settings.constraintSettings'),
            icon: 'people',
            description: t('settings.constraintSettingsDesc'),
        },
    ];

    return (
        <div className="unified-settings">
            <Container fluid className="settings-container">
                <PageHeader
                    icon="gear-fill"
                    title={t('settings.systemSettings')}
                    subtitle={t('settings.systemSettingsDesc')}
                >
                    <motion.div
                        className="d-flex gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setLocalSettings(systemSettings);
                                dispatch(addNotification({
                                    message: t('settings.resetSuccess', 'Settings reset to saved values'),
                                    variant: 'info',
                                }));
                            }}
                            disabled={!hasChanges || loading === 'pending'}
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            {t('common.reset')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={!hasChanges || loading === 'pending'}
                        >
                            {loading === 'pending' ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    {t('common.saving')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check2-circle me-2"></i>
                                    {t('common.save')}
                                </>
                            )}
                        </Button>
                    </motion.div>
                </PageHeader>


                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Row className="settings-row">
                        <Col md={4} lg={3} className="settings-sidebar">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="settings-nav-card">
                                    <Card.Body className="p-0">
                                        <Nav variant="pills" className="flex-column settings-nav">
                                            {settingsNavItems.map((item, index) => (
                                                <motion.div
                                                    key={item.key}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 + index * 0.05 }}
                                                >
                                                    <Nav.Item>
                                                        <Nav.Link
                                                            eventKey={item.key}
                                                            className="settings-nav-link"
                                                        >
                                                            <div className="nav-link-content">
                                                                <div className="nav-link-header">
                                                                    <i className={`bi bi-${item.icon} nav-icon`}></i>
                                                                    <span className="nav-title">{item.label}</span>
                                                                </div>
                                                                <small className="nav-description text-muted">
                                                                    {item.description}
                                                                </small>
                                                            </div>
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                </motion.div>
                                            ))}
                                        </Nav>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>

                        <Col md={8} lg={9} className="settings-content">
                            {error && (
                                <Alert variant="danger" role="alert" className="mb-3">
                                    {error}
                                </Alert>
                            )}
                            <Tab.Content>

                                {/* Schedule Settings */}
                                <Tab.Pane eventKey="schedule">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-calendar-week header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('settings.scheduleSettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('settings.scheduleSettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-calendar-event me-2"></i>
                                                                {t('settings.weekStartDay')}
                                                            </Form.Label>
                                                            <Form.Select
                                                                value={localSettings.weekStartDay}
                                                                onChange={(e) => handleChange('weekStartDay', parseInt(e.target.value))}
                                                                className="settings-input"
                                                            >
                                                                <option value={0}>{t('days.sunday')}</option>
                                                                <option value={1}>{t('days.monday')}</option>
                                                                <option value={2}>{t('days.tuesday')}</option>
                                                                <option value={3}>{t('days.wednesday')}</option>
                                                                <option value={4}>{t('days.thursday')}</option>
                                                                <option value={5}>{t('days.friday')}</option>
                                                                <option value={6}>{t('days.saturday')}</option>
                                                            </Form.Select>
                                                            <Form.Text className="settings-help">
                                                                {t('settings.weekStartDayHint')}
                                                            </Form.Text>
                                                        </Form.Group>
                                                    </Col>

                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-moon me-2"></i>
                                                                {t('settings.minRestBetweenShifts')}
                                                            </Form.Label>
                                                            <div className="input-group">
                                                                <Form.Control
                                                                    type="number"
                                                                    min="6"
                                                                    max="24"
                                                                    value={localSettings.minRestBetweenShifts}
                                                                    onChange={(e) => handleChange('minRestBetweenShifts', parseInt(e.target.value))}
                                                                    className="settings-input"
                                                                />
                                                                <span
                                                                    className="input-group-text">{t('settings.hours')}</span>
                                                            </div>
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-arrow-repeat me-2"></i>
                                                                {t('settings.maxConsecutiveDays')}
                                                            </Form.Label>
                                                            <div className="input-group">
                                                                <Form.Control
                                                                    type="number"
                                                                    min="1"
                                                                    max="7"
                                                                    value={localSettings.maxConsecutiveDays || 6}
                                                                    onChange={(e) => handleChange('maxConsecutiveDays', parseInt(e.target.value))}
                                                                    className="settings-input"
                                                                />
                                                                <span
                                                                    className="input-group-text">{t('settings.days')}</span>
                                                            </div>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <div className="settings-section">
                                                    <h6 className="settings-section-title">
                                                        <i className="bi bi-robot me-2"></i>
                                                        {t('settings.automationSettings')}
                                                    </h6>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="switch"
                                                            id="autoGenerate"
                                                            label={t('settings.autoGenerateSchedule')}
                                                            checked={localSettings.autoGenerateSchedule || false}
                                                            onChange={(e) => handleChange('autoGenerateSchedule', e.target.checked)}
                                                            className="settings-switch"
                                                        />
                                                        <Form.Text className="settings-help">
                                                            {t('settings.autoGenerateHint')}
                                                        </Form.Text>
                                                    </Form.Group>

                                                    {localSettings.autoGenerateSchedule && (
                                                        <Row className="mt-3">
                                                            <Col md={6}>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label className="settings-label">
                                                                        <i className="bi bi-calendar-day me-2"></i>
                                                                        {t('settings.autoGenerateDay')}
                                                                    </Form.Label>
                                                                    <Form.Select
                                                                        value={localSettings.autoGenerateDay || 0}
                                                                        onChange={(e) => handleChange('autoGenerateDay', parseInt(e.target.value))}
                                                                        className="settings-select"
                                                                    >
                                                                        <option value={0}>{t('days.sunday')}</option>
                                                                        <option value={1}>{t('days.monday')}</option>
                                                                        <option value={2}>{t('days.tuesday')}</option>
                                                                        <option value={3}>{t('days.wednesday')}</option>
                                                                        <option value={4}>{t('days.thursday')}</option>
                                                                        <option value={5}>{t('days.friday')}</option>
                                                                        <option value={6}>{t('days.saturday')}</option>
                                                                    </Form.Select>
                                                                </Form.Group>
                                                            </Col>
                                                            <Col md={6}>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label className="settings-label">
                                                                        <i className="bi bi-clock me-2"></i>
                                                                        {t('settings.autoGenerateTime')}
                                                                    </Form.Label>
                                                                    <Form.Control
                                                                        type="time"
                                                                        value={localSettings.autoGenerateTime || '06:00'}
                                                                        onChange={(e) => handleChange('autoGenerateTime', e.target.value)}
                                                                        className="settings-input"
                                                                    />
                                                                </Form.Group>
                                                            </Col>
                                                        </Row>
                                                    )}

                                                </div>

                                                <div className="settings-section">
                                                    <h6 className="settings-section-title">
                                                        <i className="bi bi-gear-wide-connected me-2"></i>
                                                        {t('settings.optimizationSettings')}
                                                    </h6>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-4">
                                                                <Form.Label className="settings-label">
                                                                    <i className="bi bi-speedometer2 me-2"></i>
                                                                    {t('settings.optimizationMode')}
                                                                </Form.Label>
                                                                <Form.Select
                                                                    value={localSettings.optimizationMode || 'balanced'}
                                                                    onChange={(e) => handleChange('optimizationMode', e.target.value)}
                                                                    className="settings-input"
                                                                >
                                                                    <option
                                                                        value="fast">{t('settings.optimizationFast')}</option>
                                                                    <option
                                                                        value="balanced">{t('settings.optimizationBalanced')}</option>
                                                                    <option
                                                                        value="thorough">{t('settings.optimizationThorough')}</option>
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-4">
                                                                <Form.Label className="settings-label">
                                                                    <i className="bi bi-graph-up me-2"></i>
                                                                    {t('settings.fairnessWeight')}
                                                                </Form.Label>
                                                                <Form.Range
                                                                    min={0}
                                                                    max={100}
                                                                    value={localSettings.fairnessWeight || 50}
                                                                    onChange={(e) => handleChange('fairnessWeight', parseInt(e.target.value))}
                                                                    className="settings-range"
                                                                />
                                                                <div className="d-flex justify-content-between">
                                                                    <small
                                                                        className="text-muted">{t('settings.efficiency')}</small>
                                                                    <small
                                                                        className="text-muted">{localSettings.fairnessWeight || 50}%</small>
                                                                    <small
                                                                        className="text-muted">{t('settings.fairness')}</small>
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </div>

                                                <div className="settings-section">
                                                    <h6 className="settings-section-title">
                                                        <i className="bi bi-bell me-2"></i>
                                                        {t('settings.notificationSettings')}
                                                    </h6>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="switch"
                                                            id="notifySchedulePublished"
                                                            label={t('settings.notifySchedulePublished')}
                                                            checked={localSettings.notifySchedulePublished || false}
                                                            onChange={(e) => handleChange('notifySchedulePublished', e.target.checked)}
                                                            className="settings-switch"
                                                        />
                                                        <Form.Text className="settings-help">
                                                            {t('settings.notifySchedulePublishedHint')}
                                                        </Form.Text>
                                                    </Form.Group>
                                                </div>

                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>



                                {/* Constraint Settings */}
                                <Tab.Pane eventKey="constraints">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-people header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('settings.constraintSettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('settings.constraintSettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-x-circle me-2"></i>
                                                                {t('settings.maxCannotWorkDays')}
                                                            </Form.Label>
                                                            <div className="input-group">
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    max="7"
                                                                    value={localSettings.maxCannotWorkDays || 2}
                                                                    onChange={(e) => handleChange('maxCannotWorkDays', parseInt(e.target.value))}
                                                                    className="settings-input"
                                                                />
                                                                <span
                                                                    className="input-group-text">{t('settings.daysPerWeek')}</span>
                                                            </div>
                                                            <Form.Text className="settings-help">
                                                                {t('settings.maxCannotWorkDaysHint')}
                                                            </Form.Text>
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-check-circle me-2"></i>
                                                                {t('settings.maxPreferWorkDays')}
                                                            </Form.Label>
                                                            <div className="input-group">
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    max="7"
                                                                    value={localSettings.maxPreferWorkDays || 3}
                                                                    onChange={(e) => handleChange('maxPreferWorkDays', parseInt(e.target.value))}
                                                                    className="settings-input"
                                                                />
                                                                <span
                                                                    className="input-group-text">{t('settings.daysPerWeek')}</span>
                                                            </div>
                                                            <Form.Text className="settings-help">
                                                                {t('settings.maxPreferWorkDaysHint')}
                                                            </Form.Text>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>

                                {/* Notification Settings */}

                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>
        </div>
    );
};

export default SystemSettings;