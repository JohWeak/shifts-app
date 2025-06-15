// frontend/src/features/schedule-management/components/GenerateScheduleModal.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Form, Button, Row, Col, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS } from '../../../shared/config/scheduleConstants';
import { getNextSunday, isValidWeekStartDate } from '../../../shared/lib/utils/scheduleUtils';
import { fetchWorkSites } from '../../../app/store/slices/scheduleSlice';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';


const GenerateScheduleModal = ({ show, onHide, onGenerate, generating }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    // Получаем данные из Redux
    const { workSites, workSitesLoading } = useSelector((state) => state.schedule || {});

    // Локальное состояние для настроек формы
    const [settings, setSettings] = useState({ ...DEFAULT_GENERATION_SETTINGS, weekStart: getNextSunday() });
    const [formError, setFormError] = useState('');

    const hasFetched = useRef(false);

    const safeWorkSites = useMemo(() => workSites || [], [workSites]);
    const safeAlgorithmTypes = useMemo(() => ALGORITHM_TYPES || [], []);


    // Эффект №1: Загрузка данных при открытии модалки
    useEffect(() => {
        // Если модалка открыта, и мы еще НЕ делали запрос
        if (show && !hasFetched.current) {
            dispatch(fetchWorkSites());
            hasFetched.current = true; // Помечаем, что запрос был сделан
        }
        // Если модалка закрывается, сбрасываем флаг для следующего открытия
        if (!show) {
            hasFetched.current = false;
        }
    }, [show, dispatch]); // Зависим только от `show` и `dispatch`

    // Второй useEffect для установки дефолтного значения остается без изменений
    useEffect(() => {
        if (show && safeWorkSites.length > 0 && (!settings.site_id || settings.site_id === 1)) {
            setSettings(prev => ({ ...prev, site_id: safeWorkSites[0].site_id }));
        }
    }, [show, safeWorkSites, settings.site_id]);



    const handleDateChange = (e) => {
        const date = e.target.value;
        if (date && !isValidWeekStartDate(date)) {
            setFormError(t.weekStartWarning);
        } else {
            setFormError('');
        }
        setSettings(prev => ({ ...prev, weekStart: date }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formError) {
            console.error('Cannot generate schedule:', formError);
            return;
        }

        // Передаем week_start вместо weekStart
        const settingsToSend = {
            ...settings,
            week_start: settings.weekStart  // Backend ожидает week_start
        };

        onGenerate(settingsToSend);
    };

    const isFormValid = settings.weekStart && settings.site_id && !formError;

    return (
        <Modal show={show} onHide={!generating ? onHide : undefined} size="lg">
            <Modal.Header closeButton={!generating}>
                <Modal.Title><i className="bi bi-plus-circle me-2"></i>{t.generating}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {generating ? (
                    <div className="text-center">
                        <p>{t.generationInProgress}</p>
                        <ProgressBar animated now={100} className="mb-3" />
                        <small className="text-muted">{t.generating}</small>
                    </div>
                ) : (
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t.weekStart}</Form.Label>
                                    <Form.Control type="date" value={settings.weekStart} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} />
                                    <Form.Text className="text-muted">{t.selectSunday}</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t.workSite}</Form.Label>
                                    {workSitesLoading === 'pending' ? <Spinner size="sm" /> :
                                        <Form.Select value={settings.site_id} onChange={(e) => setSettings(prev => ({ ...prev, site_id: parseInt(e.target.value) }))}>
                                            {/* Здесь тоже используем optional chaining для 100% надежности */}
                                            {safeWorkSites?.map(site => (
                                                <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                                            ))}
                                        </Form.Select>
                                    }
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>{t.algorithmTypes}</Form.Label>
                            <Form.Select
                                value={settings.algorithm}
                                onChange={(e) => setSettings(prev => ({ ...prev, algorithm: e.target.value }))}
                                required
                            >
                                <option value="">{t('modal.generateSchedule.selectAlgorithm')}</option>
                                {safeAlgorithmTypes.map(algo => (
                                    <option key={algo.value} value={algo.value}>
                                        {t(`modal.generateSchedule.algorithms.${algo.value}`)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {formError && <Alert variant="warning" className="mt-3">{formError}</Alert>}
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={generating}>{t.cancel}</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={generating || !isFormValid}>
                    {generating ? <Spinner as="span" size="sm" /> : <i className="bi bi-play-fill me-1"></i>}
                    {generating ? t.generating : t.generate}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GenerateScheduleModal;