//frontend/src/features/admin-schedule-management/ui/generate-schedule/index.js
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { getNextWeekStart } from 'shared/lib/utils/scheduleUtils';
import DatePicker from 'shared/ui/components/DatePicker';
import OptimizationSettings from 'shared/ui/components/OptimizationSettings';
import { ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS } from 'shared/config/scheduleConstants';
import './GenerateScheduleForm.css';

const GenerateScheduleForm = ({ onGenerate, onCancel, generating, workSites, workSitesLoading }) => {
    const { t } = useI18n();
    const { systemSettings } = useSelector(state => state.settings);
    const { positions: allPositions } = useSelector(state => state.workplace);
    const weekStartDay = systemSettings?.weekStartDay || 0;
    const dateFormat = systemSettings?.dateFormat || 'DD/MM/YYYY';
    const minSelectableDate = getNextWeekStart(weekStartDay);


    const [settings, setSettings] = useState({
        ...DEFAULT_GENERATION_SETTINGS,
        weekStart: minSelectableDate,
        algorithm: 'auto',
        position_ids: [],
        optimizationMode: systemSettings?.optimizationMode || 'balanced',
        fairnessWeight: systemSettings?.fairnessWeight || 50,
    });


    const safeWorkSites = useMemo(() => workSites || [], [workSites]);
    useMemo(() => ALGORITHM_TYPES || [], []);

    const availablePositions = useMemo(() => {
        if (!settings.site_id || !allPositions) return [];
        return allPositions.filter(p => p.site_id === settings.site_id && p.is_active);
    }, [settings.site_id, allPositions]);

    useEffect(() => {
        const activeWorkSites = safeWorkSites.filter(site => site.is_active);
        if (activeWorkSites.length > 0 && !settings.site_id) {
            setSettings(prev => ({ ...prev, site_id: activeWorkSites[0].site_id }));
        }
    }, [safeWorkSites, settings.site_id]);
    useEffect(() => {
        if (availablePositions.length > 0) {
            setSettings(prev => ({
                ...prev,
                position_ids: availablePositions.map(p => p.pos_id),
            }));
        } else {
            setSettings(prev => ({ ...prev, position_ids: [] }));
        }
    }, [availablePositions]);

    useEffect(() => {
        if (systemSettings) {
            setSettings(prev => ({
                ...prev,
                optimizationMode: systemSettings.optimizationMode || 'balanced',
                fairnessWeight: systemSettings.fairnessWeight || 50,
            }));
        }
    }, [systemSettings]);

    const handlePositionChange = (posId) => {
        setSettings(prev => {
            const newPositionIds = prev.position_ids.includes(posId)
                ? prev.position_ids.filter(id => id !== posId)
                : [...prev.position_ids, posId];
            return { ...prev, position_ids: newPositionIds };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid) {
            onGenerate(settings);
        }
    };

    const isFormValid = settings.site_id && settings.weekStart && settings.position_ids.length > 0;
    return (
        <Card className="generate-schedule-form-card">
            <Card.Body>

                <Form onSubmit={handleSubmit} className="generate-form-layout">
                    <Row>
                        <Col md={4} className="form-calendar-section">
                            <Form.Group>
                                <Form.Label>{t('modal.generateSchedule.chooseWeek')}</Form.Label>
                                <div>
                                    <DatePicker
                                        displayMode="inline"
                                        selectionMode="week"
                                        value={settings.weekStart}
                                        weekStartsOn={weekStartDay}
                                        dateFormat={dateFormat.toLowerCase().replace(/yyyy/i, 'yyyy').replace(/dd/i, 'dd').replace(/mm/i, 'MM')}
                                        onChange={(date) => setSettings(prev => ({ ...prev, weekStart: date }))}
                                    />
                                </div>
                            </Form.Group>
                        </Col>

                        <Col md={4} className="form-settings-section">
                            <Form.Group className="mb-3">
                                <Form.Label>{t('modal.generateSchedule.workSite')}</Form.Label>
                                {workSitesLoading ? <Spinner size="sm" /> : (
                                    <Form.Select
                                        style={{ cursor: 'pointer' }}
                                        value={settings.site_id || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            site_id: parseInt(e.target.value),
                                        }))}
                                    >
                                        {workSites?.filter(site => site.is_active).map(site => (
                                            <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>{t('position.positions')}</Form.Label>
                                <div className="positions-checkbox-group">
                                    {availablePositions.length > 0 ? availablePositions.map(pos => (
                                        <Form.Check
                                            key={pos.pos_id}
                                            type="checkbox"
                                            id={`pos-check-${pos.pos_id}`}
                                            label={pos.pos_name}
                                            checked={settings.position_ids.includes(pos.pos_id)}
                                            onChange={() => handlePositionChange(pos.pos_id)}
                                        />
                                    )) : <small className="text-muted">{t('position.noPositions')}</small>}
                                </div>
                            </Form.Group>
                        </Col>

                        <Col md={4} className="form-optimization-section">
                            <OptimizationSettings
                                optimizationMode={settings.optimizationMode}
                                fairnessWeight={settings.fairnessWeight}
                                onOptimizationModeChange={(value) => setSettings(prev => ({
                                    ...prev,
                                    optimizationMode: value,
                                }))}
                                onFairnessWeightChange={(value) => setSettings(prev => ({
                                    ...prev,
                                    fairnessWeight: value,
                                }))}
                                showTitle={false}
                                layout="column"
                            />
                        </Col>
                    </Row>
                </Form>

                <div className="d-flex justify-content-end gap-2 mt-3 generate-buttons">
                    <Button variant="outline-secondary" onClick={onCancel}
                            disabled={generating}>{t('common.cancel')}</Button>
                    <Button onClick={handleSubmit} variant="primary" disabled={generating || !isFormValid}>
                        {generating ? <><Spinner size="sm"
                                                 className="me-2" />{t('modal.generateSchedule.generating')}</> : t('modal.generateSchedule.generate')}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};


export default GenerateScheduleForm;