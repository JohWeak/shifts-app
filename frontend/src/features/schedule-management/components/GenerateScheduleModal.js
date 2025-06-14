// frontend/src/features/schedule-management/components/GenerateScheduleModal.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Row, Col, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useMessages } from '../../../shared/lib/i18n/messages';
import { ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS } from '../../../shared/config/scheduleConstants';
import { getNextSunday, isValidWeekStartDate } from '../../../shared/lib/utils/scheduleUtils';
import { fetchWorkSites } from '../../../app/store/slices/scheduleSlice';

const GenerateScheduleModal = ({ show, onHide, onGenerate, generating }) => {
    const messages = useMessages('en');
    const dispatch = useDispatch();

    // Получаем данные из Redux
    const { workSites, workSitesLoading } = useSelector((state) => state.schedule || {});

    // Локальное состояние для настроек формы
    const [settings, setSettings] = useState({ ...DEFAULT_GENERATION_SETTINGS, weekStart: getNextSunday() });
    const [formError, setFormError] = useState('');

    const hasFetched = useRef(false);

    // Эффект №1: Загрузка данных при открытии модалки
    useEffect(() => {
        // Если модалка открыта и мы еще НЕ делали запрос
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
        // Этот эффект отвечает ТОЛЬКО за установку дефолтного значения
        if (show && workSites.length > 0 && (!settings.site_id || settings.site_id === 1)) {
            setSettings(prev => ({ ...prev, site_id: workSites[0].site_id }));
        }
    }, [show, workSites]);

    const handleDateChange = (e) => {
        const date = e.target.value;
        if (date && !isValidWeekStartDate(date)) {
            setFormError(messages.WEEK_START_SUNDAY_WARNING);
        } else {
            setFormError('');
        }
        setSettings(prev => ({ ...prev, weekStart: date }));
    };

    const handleSubmit = () => {
        if (!settings.weekStart || !settings.site_id) {
            setFormError('Please fill all fields.');
            return;
        }
        onGenerate(settings);
    };

    const isFormValid = settings.weekStart && settings.site_id && !formError;

    return (
        <Modal show={show} onHide={!generating ? onHide : undefined} size="lg">
            <Modal.Header closeButton={!generating}>
                <Modal.Title><i className="bi bi-plus-circle me-2"></i>{messages.GENERATE_SCHEDULE}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {generating ? (
                    <div className="text-center">
                        <p>{messages.GENERATION_IN_PROGRESS}</p>
                        <ProgressBar animated now={100} className="mb-3" />
                        <small className="text-muted">{messages.GENERATION_INFO}</small>
                    </div>
                ) : (
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{messages.WEEK_START_DATE}</Form.Label>
                                    <Form.Control type="date" value={settings.weekStart} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} />
                                    <Form.Text className="text-muted">{messages.SELECT_SUNDAY_HELP}</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{messages.WORK_SITE}</Form.Label>
                                    {workSitesLoading === 'pending' ? <Spinner size="sm" /> :
                                        <Form.Select value={settings.site_id} onChange={(e) => setSettings(prev => ({ ...prev, site_id: parseInt(e.target.value) }))}>
                                            {/* Здесь тоже используем optional chaining для 100% надежности */}
                                            {workSites?.map(site => (
                                                <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                                            ))}
                                        </Form.Select>
                                    }
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>{messages.ALGORITHM}</Form.Label>
                            <Form.Select value={settings.algorithm} onChange={(e) => setSettings(prev => ({ ...prev, algorithm: e.target.value }))}>
                                <option value={ALGORITHM_TYPES.AUTO}>{messages.ALGORITHM_AUTO_DESC}</option>
                                <option value={ALGORITHM_TYPES.CP_SAT}>{messages.ALGORITHM_CP_SAT_DESC}</option>
                                <option value={ALGORITHM_TYPES.SIMPLE}>{messages.ALGORITHM_SIMPLE_DESC}</option>
                            </Form.Select>
                        </Form.Group>
                        {formError && <Alert variant="warning" className="mt-3">{formError}</Alert>}
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={generating}>{messages.CANCEL}</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={generating || !isFormValid}>
                    {generating ? <Spinner as="span" size="sm" /> : <i className="bi bi-play-fill me-1"></i>}
                    {generating ? messages.GENERATING : messages.GENERATE_SCHEDULE}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GenerateScheduleModal;