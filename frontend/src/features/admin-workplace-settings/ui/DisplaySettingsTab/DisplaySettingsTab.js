// frontend/src/features/admin-workplace-settings/ui/DisplaySettingsTab/DisplaySettingsTab.js
import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Button,
    Row,
    Col,
    Alert
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchSystemSettings, updateSystemSettings } from '../../../admin-system-settings/model/settingsSlice';

import './DisplaySettingsTab.css';

const DisplaySettingsTab = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { systemSettings, loading } = useSelector(state => state.settings);

    const [localSettings, setLocalSettings] = useState({
        dateFormat: systemSettings?.dateFormat || 'DD/MM/YYYY',
        timeFormat: systemSettings?.timeFormat || '24h'
    });

    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
        if (systemSettings) {
            setLocalSettings({
                dateFormat: systemSettings.dateFormat || 'DD/MM/YYYY',
                timeFormat: systemSettings.timeFormat || '24h'
            });
        }
    }, [systemSettings]);

    useEffect(() => {
        const settingsChanged =
            localSettings.dateFormat !== systemSettings?.dateFormat ||
            localSettings.timeFormat !== systemSettings?.timeFormat;
        setHasChanges(settingsChanged);
    }, [localSettings, systemSettings]);

    const handleChange = (field, value) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
        setSaveSuccess(false);
        setSaveError(null);
    };

    const handleSave = async () => {
        try {
            await dispatch(updateSystemSettings({
                ...systemSettings,
                ...localSettings
            })).unwrap();

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            setSaveError(error.message || t('common.error'));
        }
    };

    const handleReset = () => {
        setLocalSettings({
            dateFormat: systemSettings?.dateFormat || 'DD/MM/YYYY',
            timeFormat: systemSettings?.timeFormat || '24h'
        });
        setSaveSuccess(false);
        setSaveError(null);
    };

    // Example date/time displays
    const currentDate = new Date();
    const dateExamples = {
        'DD/MM/YYYY': currentDate.toLocaleDateString('en-GB'),
        'MM/DD/YYYY': currentDate.toLocaleDateString('en-US'),
        'YYYY-MM-DD': currentDate.toISOString().split('T')[0],
        'DD.MM.YYYY': currentDate.toLocaleDateString('de-DE')
    };

    const timeExamples = {
        '24h': currentDate.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        '12h': currentDate.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })
    };

    return (
        <Card className="workplace-tab-content">
            <Card.Header>
                <h5 className="mb-0">{t('workplace.displaySettings.title')}</h5>
            </Card.Header>

            <Card.Body>
                {saveSuccess && (
                    <Alert
                        variant="success"
                        dismissible
                        onClose={() => setSaveSuccess(false)}
                    >
                        {t('settings.settingsSaved')}
                    </Alert>
                )}

                {saveError && (
                    <Alert
                        variant="danger"
                        dismissible
                        onClose={() => setSaveError(null)}
                    >
                        {saveError}
                    </Alert>
                )}

                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-4">
                                <Form.Label>
                                    {t('workplace.displaySettings.dateFormat')}
                                </Form.Label>
                                <Form.Select
                                    value={localSettings.dateFormat}
                                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                                >
                                    {Object.entries(dateExamples).map(([format, example]) => (
                                        <option key={format} value={format}>
                                            {format} ({example})
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    {t('workplace.displaySettings.dateFormatHint')}
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-4">
                                <Form.Label>
                                    {t('workplace.displaySettings.timeFormat')}
                                </Form.Label>
                                <Form.Select
                                    value={localSettings.timeFormat}
                                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                                >
                                    <option value="24h">
                                        {t('workplace.displaySettings.formats.time.24h')} ({timeExamples['24h']})
                                    </option>
                                    <option value="12h">
                                        {t('workplace.displaySettings.formats.time.12h')} ({timeExamples['12h']})
                                    </option>
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    {t('workplace.displaySettings.timeFormatHint')}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="settings-preview mt-4 p-4">
                        <h6 className="text-muted mb-3">{t('workplace.displaySettings.preview')}</h6>
                        <Row>
                            <Col md={6}>
                                <div className="preview-item">
                                    <small className="text-muted d-block">
                                        {t('workplace.displaySettings.dateExample')}
                                    </small>
                                    <div className="preview-value">
                                        {dateExamples[localSettings.dateFormat]}
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="preview-item">
                                    <small className="text-muted d-block">
                                        {t('workplace.displaySettings.timeExample')}
                                    </small>
                                    <div className="preview-value">
                                        {timeExamples[localSettings.timeFormat]}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button
                            variant="outline-secondary"
                            onClick={handleReset}
                            disabled={!hasChanges || loading === 'pending'}
                        >
                            {t('common.reset')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={!hasChanges || loading === 'pending'}
                        >
                            {loading === 'pending' ? t('common.saving') : t('common.save')}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default DisplaySettingsTab;