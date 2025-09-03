import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Alert, Button, Card, Col, Container, Form, Row, Spinner} from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import OptimizationSettings from 'shared/ui/components/OptimizationSettings';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {fetchSystemSettings, setCurrentSite, updateLocalSettings, updateSystemSettings} from './model/settingsSlice';
import {fetchWorkSites} from '../admin-workplace-settings/model/workplaceSlice';
import {addNotification} from '../../app/model/notificationsSlice';
import {motion} from 'motion/react';

import './index.css';

const SystemSettings = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const {systemSettings, loading, error, currentSiteId} = useSelector(state => state.settings);
    const {workSites = []} = useSelector(state => state.workplace || {});

    const [localSettings, setLocalSettings] = useState(systemSettings);
    const [selectedSiteId, setSelectedSiteId] = useState(currentSiteId);

    useEffect(() => {
        // Fetch work sites for the selector
        dispatch(fetchWorkSites());

        // Fetch settings for current site
        dispatch(fetchSystemSettings({siteId: selectedSiteId})).then((result) => {
            if (fetchSystemSettings.rejected.match(result)) {
                dispatch(addNotification({
                    message: t('settings.fetchError', 'Failed to load settings'),
                    variant: 'danger',
                }));
            }
        });
    }, [dispatch, t, selectedSiteId]);

    useEffect(() => {
        if (systemSettings && Object.keys(systemSettings).length > 0) {
            setLocalSettings(systemSettings);
        }
    }, [systemSettings]);

    useEffect(() => {
        setSelectedSiteId(currentSiteId);
    }, [currentSiteId]);

    const handleChange = (field, value) => {
        setLocalSettings(prev => ({...prev, [field]: value}));
    };

    const handleSiteChange = (siteId) => {
        setSelectedSiteId(siteId);
        dispatch(setCurrentSite(siteId));
    };

    const handleSave = async () => {
        try {
            // Optimistically updating the Redux state right away
            dispatch(updateLocalSettings(localSettings));

            const result = await dispatch(updateSystemSettings({
                settings: localSettings,
                siteId: selectedSiteId
            }));

            if (updateSystemSettings.fulfilled.match(result)) {
                dispatch(addNotification({
                    message: t('settings.saveSuccess', 'Settings saved successfully'),
                    variant: 'success',
                }));
            } else {
                setLocalSettings(systemSettings);
                dispatch(addNotification({
                    message: t('settings.saveError', 'Failed to save settings'),
                    variant: 'danger',
                }));
            }
        } catch (error) {
            //Rolling back changes in case of error
            setLocalSettings(systemSettings);
            dispatch(addNotification({
                message: t('settings.saveError', 'Failed to save settings'),
                variant: 'danger',
            }));
        }
    };

    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(systemSettings);

    // Get current site name for display
    const currentSiteName = selectedSiteId
        // eslint-disable-next-line
        ? workSites.find(site => site.site_id == selectedSiteId)?.site_name
        : null;

    if (loading === 'pending' && localSettings.weekStartDay === undefined) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
                <Spinner animation="border" role="status" aria-label="Loading..."/>
            </Container>
        );
    }


    return (
        <div className="system-settings-page">
            <Container fluid className="settings-container">
                <PageHeader
                    icon="gear-fill"
                    title={currentSiteName
                        ? `${currentSiteName} ${t('settings.systemSettings')} `
                        : t('settings.systemSettings')
                    }
                    subtitle={currentSiteName
                        ? t('settings.siteSpecificSettingsDesc', {siteName: currentSiteName})
                        : t('settings.systemSettingsDesc')
                    }
                >
                    <motion.div
                        className="d-flex gap-2"
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: 0.2}}
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
                                    <Spinner size="sm" className="me-2"/>
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

                {/* Site Selector */}
                <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.1}}
                    className="mb-4"
                >
                    <Card className="settings-card">
                        <Card.Body className="py-3">
                            <Row className="align-items-center">
                                <Col md={6}>
                                    <Form.Group className="mb-0">
                                        <Form.Label className="settings-label">
                                            <i className="bi bi-building me-2"></i>
                                            {t('settings.workSite', 'Work Site')}
                                        </Form.Label>
                                        <Form.Select
                                            value={selectedSiteId || ''}
                                            onChange={(e) => handleSiteChange(e.target.value || null)}
                                            className="settings-input"
                                        >
                                            <option
                                                value="">{t('settings.globalSettings', 'Global Settings (All Sites)')}</option>
                                            {workSites
                                                .filter(site => site.is_active)
                                                .map(site => (
                                                    <option key={site.site_id} value={site.site_id}>
                                                        {site.site_name}
                                                    </option>
                                                ))
                                            }
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Text className="settings-help">
                                        {selectedSiteId
                                            ? t('settings.siteSpecificHint', 'These settings apply only to the selected work site and override global settings.')
                                            : t('settings.globalSettingsHint', 'These settings apply to all work sites unless overridden by site-specific settings.')
                                        }
                                    </Form.Text>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </motion.div>

                <div className="settings-row px-0">
                    <Col className="settings-content">
                        {error && (
                            <Alert variant="danger" role="alert" className="mb-3">
                                {error}
                            </Alert>
                        )}

                        <div className="settings-cards">

                            {/* Schedule Settings */}
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.1}}
                                className="mb-4"
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
                                            <OptimizationSettings
                                                optimizationMode={localSettings.optimizationMode || 'balanced'}
                                                fairnessWeight={localSettings.fairnessWeight || 50}
                                                onOptimizationModeChange={(value) => handleChange('optimizationMode', value)}
                                                onFairnessWeightChange={(value) => handleChange('fairnessWeight', value)}
                                                showTitle={true}
                                            />
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

                            {/* Constraint Settings */}
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.2}}
                                className="mb-4"
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

                                        <div className="mt-4">
                                            <h6 className="settings-section-title">
                                                <i className="bi bi-clock-history me-2"></i>
                                                {t('settings.constraintDeadlineDay')} & {t('settings.constraintDeadlineTime')}
                                            </h6>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="settings-label">
                                                            <i className="bi bi-calendar-day me-2"></i>
                                                            {t('settings.constraintDeadlineDay')}
                                                        </Form.Label>
                                                        <Form.Select
                                                            value={localSettings.constraintDeadlineDay || 3}
                                                            onChange={(e) => handleChange('constraintDeadlineDay', parseInt(e.target.value))}
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
                                                            {t('settings.constraintDeadlineTime')}
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="time"
                                                            value={localSettings.constraintDeadlineTime || '18:00'}
                                                            onChange={(e) => handleChange('constraintDeadlineTime', e.target.value)}
                                                            className="settings-input"
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Form.Text className="settings-help">
                                                {t('settings.constraintDeadlineHint')}
                                            </Form.Text>
                                        </div>

                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </div>
                    </Col>
                </div>
            </Container>
        </div>
    );
};

export default SystemSettings;