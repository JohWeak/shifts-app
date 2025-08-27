import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, Col, Container, Form, Nav, Row, Spinner, Tab } from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchSystemSettings, updateSystemSettings } from './model/settingsSlice';
import { fetchWorkSites } from '../admin-schedule-management/model/scheduleSlice';
import PositionSettings from '../admin-position-settings';

import './index.css';

const SystemSettings = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { systemSettings, loading, error } = useSelector(state => state.settings);
    const { workSites, workSitesLoading } = useSelector(state => state.schedule);

    const [localSettings, setLocalSettings] = useState(systemSettings);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [selectedSiteId, setSelectedSiteId] = useState('');


    useEffect(() => {
        dispatch(fetchSystemSettings());
        dispatch(fetchWorkSites());
    }, [dispatch]);

    useEffect(() => {
        setLocalSettings(systemSettings);
    }, [systemSettings]);

    const handleChange = (field, value) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaveSuccess(false);
        const result = await dispatch(updateSystemSettings(localSettings));
        if (updateSystemSettings.fulfilled.match(result)) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(systemSettings);

    if (loading === 'pending' && !localSettings.weekStartDay !== undefined) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container fluid className="px-0">
            <PageHeader
                icon="gear"
                title={t('settings.systemSettings')}
                subtitle={t('settings.settingsSubtitle')}

            >
                <div className="d-flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setLocalSettings(systemSettings)}
                        disabled={!hasChanges || loading === 'pending'}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        {t('common.cancel')}
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
                                <i className="bi bi-check-circle me-2"></i>
                                {t('common.save')}
                            </>
                        )}
                    </Button>
                </div>
            </PageHeader>

            {error && (
                <Alert variant="danger" dismissible onClose={() => {
                }}>
                    {error}
                </Alert>
            )}

            {saveSuccess && (
                <Alert variant="success" dismissible onClose={() => setSaveSuccess(false)}>
                    {t('settings.saveSuccess')}
                </Alert>
            )}

            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Row>
                    <Col md={3}>
                        <Card className="mb-4">
                            <Card.Body className="p-0">
                                <Nav variant="pills" className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link eventKey="general">
                                            <i className="bi bi-sliders me-2"></i>
                                            {t('settings.generalSettings')}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="schedule">
                                            <i className="bi bi-calendar-week me-2"></i>
                                            {t('settings.scheduleSettings')}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="positions">
                                            <i className="bi bi-diagram-3 me-2"></i>
                                            {t('settings.positionSettings')}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="constraints">
                                            <i className="bi bi-people me-2"></i>
                                            {t('settings.constraintSettings')}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="notifications">
                                            <i className="bi bi-bell me-2"></i>
                                            {t('settings.notificationSettings')}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="security">
                                            <i className="bi bi-shield-lock me-2"></i>
                                            {t('settings.securitySettings')}
                                        </Nav.Link>
                                    </Nav.Item>

                                </Nav>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={9}>
                        <Tab.Content>

                            {/* General Settings */}
                            <Tab.Pane eventKey="general">
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">{t('settings.generalSettings')}</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('settings.dateFormat')}</Form.Label>
                                                    <Form.Select
                                                        value={localSettings.dateFormat}
                                                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                                                    >
                                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('settings.timeFormat')}</Form.Label>
                                                    <Form.Select
                                                        value={localSettings.timeFormat}
                                                        onChange={(e) => handleChange('timeFormat', e.target.value)}
                                                    >
                                                        <option value="24h">24-hour</option>
                                                        <option value="12h">12-hour (AM/PM)</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            {/* Schedule Settings */}
                            <Tab.Pane eventKey="schedule">
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">{t('settings.scheduleSettings')}</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.weekStartDay')}</Form.Label>
                                                    <Form.Select
                                                        value={localSettings.weekStartDay}
                                                        onChange={(e) => handleChange('weekStartDay', parseInt(e.target.value))}
                                                    >
                                                        <option value={0}>{t('days.sunday')}</option>
                                                        <option value={1}>{t('days.monday')}</option>
                                                        <option value={2}>{t('days.tuesday')}</option>
                                                        <option value={3}>{t('days.wednesday')}</option>
                                                        <option value={4}>{t('days.thursday')}</option>
                                                        <option value={5}>{t('days.friday')}</option>
                                                        <option value={6}>{t('days.saturday')}</option>
                                                    </Form.Select>
                                                    <Form.Text className="text-muted">
                                                        {t('settings.weekStartDayHint')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.defaultScheduleDuration')}</Form.Label>
                                                    <Form.Select
                                                        value={localSettings.defaultScheduleDuration}
                                                        onChange={(e) => handleChange('defaultScheduleDuration', parseInt(e.target.value))}
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
                                                    <Form.Label>{t('settings.minRestBetweenShifts')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            min="6"
                                                            max="24"
                                                            value={localSettings.minRestBetweenShifts}
                                                            onChange={(e) => handleChange('minRestBetweenShifts', parseInt(e.target.value))}
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.hours')}</span>
                                                    </div>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.maxConsecutiveDays')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            min="1"
                                                            max="7"
                                                            value={localSettings.maxConsecutiveDays || 6}
                                                            onChange={(e) => handleChange('maxConsecutiveDays', parseInt(e.target.value))}
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.days')}</span>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <hr />

                                        <h6 className="mb-3">{t('settings.automationSettings')}</h6>

                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="autoPublish"
                                                label={t('settings.autoPublishSchedule')}
                                                checked={localSettings.autoPublishSchedule}
                                                onChange={(e) => handleChange('autoPublishSchedule', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted d-block ms-4">
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
                                            />
                                            <Form.Text className="text-muted d-block ms-4">
                                                {t('settings.autoAssignHint')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                            {/* Positions Settings */}
                            <Tab.Pane eventKey="positions">
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">{t('settings.positionSettings')}</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-4">
                                            <Form.Label>{t('settings.selectSite')}</Form.Label>
                                            <Form.Select
                                                value={selectedSiteId}
                                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                                disabled={workSitesLoading === 'pending'} // Блокируем, пока идет загрузка
                                            >
                                                <option value="">{t('settings.selectSitePrompt')}</option>
                                                {/* Используем workSites из Redux */}
                                                {(workSites || []).map(site => (
                                                    <option key={site.site_id} value={site.site_id}>
                                                        {site.site_name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        {selectedSiteId && (
                                            <PositionSettings siteId={selectedSiteId} />
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            {/* Constraint Settings */}
                            <Tab.Pane eventKey="constraints">
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-3">{t('settings.constraintSettings')}</h6>
                                    </Card.Header>
                                    <Card.Body>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.maxCannotWorkDays')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max="7"
                                                            value={localSettings.maxCannotWorkDays || 2}
                                                            onChange={(e) => handleChange('maxCannotWorkDays', parseInt(e.target.value))}
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.daysPerWeek')}</span>
                                                    </div>
                                                    <Form.Text className="text-muted">
                                                        {t('settings.maxCannotWorkDaysHint')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.maxPreferWorkDays')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max="7"
                                                            value={localSettings.maxPreferWorkDays || 3}
                                                            onChange={(e) => handleChange('maxPreferWorkDays', parseInt(e.target.value))}
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.daysPerWeek')}</span>
                                                    </div>
                                                    <Form.Text className="text-muted">
                                                        {t('settings.maxPreferWorkDaysHint')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.defaultEmployeesPerShift')}</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={localSettings.defaultEmployeesPerShift || 1}
                                                        onChange={(e) => handleChange('defaultEmployeesPerShift', parseInt(e.target.value))}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        {t('settings.defaultEmployeesPerShiftHint')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label>{t('settings.algorithmMaxTime')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            min="30"
                                                            max="300"
                                                            step="30"
                                                            value={localSettings.algorithmMaxTime || 120}
                                                            onChange={(e) => handleChange('algorithmMaxTime', parseInt(e.target.value))}
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.seconds')}</span>
                                                    </div>
                                                    <Form.Text className="text-muted">
                                                        {t('settings.algorithmMaxTimeHint')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {/* Legal Compliance Settings */}
                                        <hr className="my-4" />
                                        <h6 className="mb-3">{t('settings.legalCompliance')}</h6>

                                        <Alert variant="info">
                                            <i className="bi bi-info-circle me-2"></i>
                                            {t('settings.legalComplianceInfo')}
                                        </Alert>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('settings.maxHoursPerDay')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            value={12}
                                                            disabled
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.hours')}</span>
                                                    </div>
                                                    <Form.Text className="text-muted">
                                                        {t('settings.fixedByLaw')}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('settings.minRestBetweenShifts')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            value={11}
                                                            disabled
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.hours')}</span>
                                                    </div>
                                                    <Form.Text className="text-muted">
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
                                            />
                                            <Form.Text className="text-muted d-block ms-4">
                                                {t('settings.strictLegalComplianceHint')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            {/* Notification Settings */}
                            <Tab.Pane eventKey="notifications">
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">{t('settings.notificationSettings')}</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="enableNotifications"
                                                label={t('settings.enableNotifications')}
                                                checked={localSettings.enableNotifications}
                                                onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                                            />
                                        </Form.Group>

                                        <hr />

                                        <h6 className="mb-3">{t('settings.notificationTypes')}</h6>

                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="checkbox"
                                                id="notifySchedulePublished"
                                                label={t('settings.notifySchedulePublished')}
                                                checked={localSettings.notifySchedulePublished ?? true}
                                                onChange={(e) => handleChange('notifySchedulePublished', e.target.checked)}
                                                disabled={!localSettings.enableNotifications}
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
                                            />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            {/* Security Settings */}
                            <Tab.Pane eventKey="security">
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">{t('settings.securitySettings')}</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('settings.sessionTimeout')}</Form.Label>
                                                    <div className="input-group">
                                                        <Form.Control
                                                            type="number"
                                                            min="15"
                                                            max="480"
                                                            step="15"
                                                            value={localSettings.sessionTimeout || 60}
                                                            onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                                                        />
                                                        <span
                                                            className="input-group-text">{t('settings.minutes')}</span>
                                                    </div>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('settings.passwordMinLength')}</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        min="6"
                                                        max="20"
                                                        value={localSettings.passwordMinLength || 8}
                                                        onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
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
                                            />
                                            <Form.Text className="text-muted d-block ms-4">
                                                {t('settings.requirePasswordChangeHint')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </Container>
    );
};

export default SystemSettings;