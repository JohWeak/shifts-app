//frontend/src/features/admin-schedule-management/ui/generate-schedule/GenerateScheduleForm.js
import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Row, Col, Spinner, Card } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { getNextWeekStart } from 'shared/lib/utils/scheduleUtils';
import DatePicker from 'shared/ui/components/DatePicker/DatePicker';
import { ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS } from 'shared/config/scheduleConstants';

const GenerateScheduleForm = ({ onGenerate, onCancel, generating, workSites, workSitesLoading }) => {
    const { t } = useI18n();
    const { systemSettings } = useSelector(state => state.settings);
    const weekStartDay = systemSettings?.weekStartDay || 0;
    const minSelectableDate = getNextWeekStart(weekStartDay);

    const [settings, setSettings] = useState({
        ...DEFAULT_GENERATION_SETTINGS,
        weekStart: minSelectableDate,
        algorithm: 'auto'
    });
    const [formError, setFormError] = useState('');

    const safeWorkSites = useMemo(() => workSites || [], [workSites]);
    const safeAlgorithmTypes = useMemo(() => ALGORITHM_TYPES || [], []);

    useEffect(() => {
        const activeWorkSites = safeWorkSites.filter(site => site.is_active);
        if (activeWorkSites.length > 0 && !settings.site_id) {
            setSettings(prev => ({ ...prev, site_id: activeWorkSites[0].site_id }));
        }
    }, [safeWorkSites, settings.site_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid) {
            onGenerate(settings);
        }
    };

    const isFormValid = settings.site_id && settings.weekStart && settings.algorithm && !formError;

    return (
        <Card className="generate-schedule-form-card px-2">
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">

                        <Col md={6}>
                            <Form.Group controlId="weekStart">
                                <Form.Label>{t('modal.generateSchedule.weekStart')}</Form.Label>
                                <DatePicker
                                    displayMode="inline"
                                    selectionMode="week"
                                    value={settings.weekStart}
                                    weekStartsOn={weekStartDay}
                                    onChange={(date) => setSettings(prev => ({ ...prev, weekStart: date }))}
                                    isInvalid={!!formError}
                                />
                                <Form.Control.Feedback type="invalid">{formError}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{t('modal.generateSchedule.workSite')}</Form.Label>
                                {workSitesLoading === 'pending' ? <Spinner size="sm" /> : (
                                    <Form.Select
                                        style={{cursor: 'pointer'}}
                                        value={settings.site_id || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, site_id: parseInt(e.target.value) }))}
                                    >
                                        {safeWorkSites?.filter(site => site.is_active).map(site => (
                                            <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 generate-buttons">
                        <Button variant="outline-secondary" onClick={onCancel} disabled={generating}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="primary" disabled={generating || !isFormValid}>
                            {generating ? <><Spinner size="sm" className="me-2" />{t('modal.generateSchedule.generating')}</> : t('modal.generateSchedule.generate')}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default GenerateScheduleForm;