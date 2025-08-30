import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, Col, Container, Form, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchSystemSettings, updateLocalSettings, updateSystemSettings } from './model/settingsSlice';
import { fetchWorkSites } from '../admin-schedule-management/model/scheduleSlice';
import { addNotification } from '../../app/model/notificationsSlice';
import PositionSettings from '../admin-position-settings';
import { motion } from 'motion/react';

import './index.css';

const SystemSettings = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { systemSettings, loading, error } = useSelector(state => state.settings);
    const { workSites, workSitesLoading } = useSelector(state => state.schedule);

    const [localSettings, setLocalSettings] = useState(systemSettings);
    const [activeTab, setActiveTab] = useState('general');
    const [selectedSiteId, setSelectedSiteId] = useState('');

    useEffect(() => {
        dispatch(fetchSystemSettings()).then((result) => {
            if (fetchSystemSettings.rejected.match(result)) {
                dispatch(addNotification({
                    message: t('settings.fetchError', 'Failed to load settings'),
                    variant: 'danger',
                }));
            }
        });
        dispatch(fetchWorkSites());
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
            key: 'general',
            label: t('settings.generalSettings'),
            icon: 'sliders',
            description: t('settings.generalSettingsDesc'),
        },
        {
            key: 'schedule',
            label: t('settings.scheduleSettings'),
            icon: 'calendar-week',
            description: t('settings.scheduleSettingsDesc'),
        },
        {
            key: 'algorithm',
            label: t('dashboard.quickActions.algorithmSettings'),
            icon: 'cpu-fill',
            description: t('dashboard.quickActions.algorithmSettingsDesc'),
        },
        {
            key: 'positions',
            label: t('settings.positionSettings'),
            icon: 'diagram-3',
            description: t('settings.positionSettingsDesc'),
        },
        {
            key: 'constraints',
            label: t('settings.constraintSettings'),
            icon: 'people',
            description: t('settings.constraintSettingsDesc'),
        },
        {
            key: 'notifications',
            label: t('settings.notificationSettings'),
            icon: 'bell',
            description: t('settings.notificationSettingsDesc'),
        },
        {
            key: 'security',
            label: t('settings.securitySettings'),
            icon: 'shield-lock',
            description: t('settings.securitySettingsDesc'),
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
                                {/* General Settings */}
                                <Tab.Pane eventKey="general">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-sliders header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('settings.generalSettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('settings.generalSettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-calendar-date me-2"></i>
                                                                {t('settings.dateFormat')}
                                                            </Form.Label>
                                                            <Form.Select
                                                                value={localSettings.dateFormat}
                                                                onChange={(e) => handleChange('dateFormat', e.target.value)}
                                                                className="settings-input"
                                                            >
                                                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-clock me-2"></i>
                                                                {t('settings.timeFormat')}
                                                            </Form.Label>
                                                            <Form.Select
                                                                value={localSettings.timeFormat}
                                                                onChange={(e) => handleChange('timeFormat', e.target.value)}
                                                                className="settings-input"
                                                            >
                                                                <option value="24h">24-hour</option>
                                                                <option value="12h">12-hour (AM/PM)</option>
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>

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

                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-calendar-range me-2"></i>
                                                                {t('settings.defaultScheduleDuration')}
                                                            </Form.Label>
                                                            <Form.Select
                                                                value={localSettings.defaultScheduleDuration}
                                                                onChange={(e) => handleChange('defaultScheduleDuration', parseInt(e.target.value))}
                                                                className="settings-input"
                                                            >
                                                                <option value={7}>1 {t('common.week')}</option>
                                                                <option value={14}>2 {t('common.weeks')}</option>
                                                                <option value={21}>3 {t('common.weeks')}</option>
                                                                <option value={28}>4 {t('common.weeks')}</option>
                                                            </Form.Select>
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
                                                            id="autoPublish"
                                                            label={t('settings.autoPublishSchedule')}
                                                            checked={localSettings.autoPublishSchedule}
                                                            onChange={(e) => handleChange('autoPublishSchedule', e.target.checked)}
                                                            className="settings-switch"
                                                        />
                                                        <Form.Text className="settings-help">
                                                            {t('settings.autoPublishHint')}
                                                        </Form.Text>
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="switch"
                                                            id="autoAssignShifts"
                                                            label={t('settings.autoAssignShifts')}
                                                            checked={localSettings.autoAssignShifts || false}
                                                            onChange={(e) => handleChange('autoAssignShifts', e.target.checked)}
                                                            className="settings-switch"
                                                        />
                                                        <Form.Text className="settings-help">
                                                            {t('settings.autoAssignHint')}
                                                        </Form.Text>
                                                    </Form.Group>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>

                                {/* Algorithm Settings */}
                                <Tab.Pane eventKey="algorithm">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-cpu-fill header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('dashboard.quickActions.algorithmSettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('dashboard.quickActions.algorithmSettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-stopwatch me-2"></i>
                                                                {t('settings.algorithmMaxTime')}
                                                            </Form.Label>
                                                            <div className="input-group">
                                                                <Form.Control
                                                                    type="number"
                                                                    min="30"
                                                                    max="300"
                                                                    step="30"
                                                                    value={localSettings.algorithmMaxTime || 120}
                                                                    onChange={(e) => handleChange('algorithmMaxTime', parseInt(e.target.value))}
                                                                    className="settings-input"
                                                                />
                                                                <span
                                                                    className="input-group-text">{t('settings.seconds')}</span>
                                                            </div>
                                                            <Form.Text className="settings-help">
                                                                {t('settings.algorithmMaxTimeHint')}
                                                            </Form.Text>
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-people me-2"></i>
                                                                {t('settings.defaultEmployeesPerShift')}
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                min="1"
                                                                max="10"
                                                                value={localSettings.defaultEmployeesPerShift || 1}
                                                                onChange={(e) => handleChange('defaultEmployeesPerShift', parseInt(e.target.value))}
                                                                className="settings-input"
                                                            />
                                                            <Form.Text className="settings-help">
                                                                {t('settings.defaultEmployeesPerShiftHint')}
                                                            </Form.Text>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

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
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>

                                {/* Rest of the tabs remain the same as in SystemSettings but with updated styling */}
                                {/* Positions Settings */}
                                <Tab.Pane eventKey="positions">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-diagram-3 header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('settings.positionSettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('settings.positionSettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="settings-label">
                                                        <i className="bi bi-building me-2"></i>
                                                        {t('settings.selectSite')}
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={selectedSiteId}
                                                        onChange={(e) => setSelectedSiteId(e.target.value)}
                                                        disabled={workSitesLoading === 'pending'}
                                                        className="settings-input"
                                                    >
                                                        <option value="">{t('settings.selectSitePrompt')}</option>
                                                        {(workSites || []).map(site => (
                                                            <option key={site.site_id} value={site.site_id}>
                                                                {site.site_name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>

                                                {selectedSiteId && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        transition={{ delay: 0.1 }}
                                                    >
                                                        <PositionSettings siteId={selectedSiteId} />
                                                    </motion.div>
                                                )}
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

                                                <div className="settings-section">
                                                    <h6 className="settings-section-title">
                                                        <i className="bi bi-shield-check me-2"></i>
                                                        {t('settings.legalCompliance')}
                                                    </h6>

                                                    <Alert variant="info" className="settings-alert">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        {t('settings.legalComplianceInfo')}
                                                    </Alert>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="settings-label">
                                                                    <i className="bi bi-clock-history me-2"></i>
                                                                    {t('settings.maxHoursPerDay')}
                                                                </Form.Label>
                                                                <div className="input-group">
                                                                    <Form.Control
                                                                        type="number"
                                                                        value={12}
                                                                        disabled
                                                                        className="settings-input"
                                                                    />
                                                                    <span
                                                                        className="input-group-text">{t('settings.hours')}</span>
                                                                </div>
                                                                <Form.Text className="settings-help">
                                                                    {t('settings.fixedByLaw')}
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label className="settings-label">
                                                                    <i className="bi bi-moon me-2"></i>
                                                                    {t('settings.minRestBetweenShifts')}
                                                                </Form.Label>
                                                                <div className="input-group">
                                                                    <Form.Control
                                                                        type="number"
                                                                        value={11}
                                                                        disabled
                                                                        className="settings-input"
                                                                    />
                                                                    <span
                                                                        className="input-group-text">{t('settings.hours')}</span>
                                                                </div>
                                                                <Form.Text className="settings-help">
                                                                    {t('settings.fixedByLaw')}
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="switch"
                                                            id="strictLegalCompliance"
                                                            label={t('settings.strictLegalCompliance')}
                                                            checked={localSettings.strictLegalCompliance ?? true}
                                                            onChange={(e) => handleChange('strictLegalCompliance', e.target.checked)}
                                                            className="settings-switch"
                                                        />
                                                        <Form.Text className="settings-help">
                                                            {t('settings.strictLegalComplianceHint')}
                                                        </Form.Text>
                                                    </Form.Group>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>

                                {/* Notification Settings */}
                                <Tab.Pane eventKey="notifications">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-bell header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('settings.notificationSettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('settings.notificationSettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Form.Group className="mb-4">
                                                    <Form.Check
                                                        type="switch"
                                                        id="enableNotifications"
                                                        label={t('settings.enableNotifications')}
                                                        checked={localSettings.enableNotifications}
                                                        onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                                                        className="settings-switch main-switch"
                                                    />
                                                </Form.Group>

                                                <div className="settings-section">
                                                    <h6 className="settings-section-title">
                                                        <i className="bi bi-bell-fill me-2"></i>
                                                        {t('settings.notificationTypes')}
                                                    </h6>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id="notifySchedulePublished"
                                                            label={t('settings.notifySchedulePublished')}
                                                            checked={localSettings.notifySchedulePublished ?? true}
                                                            onChange={(e) => handleChange('notifySchedulePublished', e.target.checked)}
                                                            disabled={!localSettings.enableNotifications}
                                                            className="settings-checkbox"
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id="notifyShiftReminder"
                                                            label={t('settings.notifyShiftReminder')}
                                                            checked={localSettings.notifyShiftReminder ?? true}
                                                            onChange={(e) => handleChange('notifyShiftReminder', e.target.checked)}
                                                            disabled={!localSettings.enableNotifications}
                                                            className="settings-checkbox"
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id="notifyScheduleChange"
                                                            label={t('settings.notifyScheduleChange')}
                                                            checked={localSettings.notifyScheduleChange ?? true}
                                                            onChange={(e) => handleChange('notifyScheduleChange', e.target.checked)}
                                                            disabled={!localSettings.enableNotifications}
                                                            className="settings-checkbox"
                                                        />
                                                    </Form.Group>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>

                                {/* Security Settings */}
                                <Tab.Pane eventKey="security">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Card className="settings-card">
                                            <Card.Header className="settings-card-header">
                                                <div className="header-content">
                                                    <i className="bi bi-shield-lock header-icon"></i>
                                                    <div>
                                                        <h5 className="mb-1">{t('settings.securitySettings')}</h5>
                                                        <small
                                                            className="text-muted">{t('settings.securitySettingsDesc')}</small>
                                                    </div>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="settings-card-body">
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-hourglass-split me-2"></i>
                                                                {t('settings.sessionTimeout')}
                                                            </Form.Label>
                                                            <div className="input-group">
                                                                <Form.Control
                                                                    type="number"
                                                                    min="15"
                                                                    max="480"
                                                                    step="15"
                                                                    value={localSettings.sessionTimeout || 60}
                                                                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                                                                    className="settings-input"
                                                                />
                                                                <span
                                                                    className="input-group-text">{t('settings.minutes')}</span>
                                                            </div>
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="settings-label">
                                                                <i className="bi bi-key me-2"></i>
                                                                {t('settings.passwordMinLength')}
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                min="6"
                                                                max="20"
                                                                value={localSettings.passwordMinLength || 8}
                                                                onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
                                                                className="settings-input"
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="switch"
                                                        id="requirePasswordChange"
                                                        label={t('settings.requirePasswordChange')}
                                                        checked={localSettings.requirePasswordChange || false}
                                                        onChange={(e) => handleChange('requirePasswordChange', e.target.checked)}
                                                        className="settings-switch"
                                                    />
                                                    <Form.Text className="settings-help">
                                                        {t('settings.requirePasswordChangeHint')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>
        </div>
    );
};

export default SystemSettings;