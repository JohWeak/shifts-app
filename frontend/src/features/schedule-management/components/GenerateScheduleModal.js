// frontend/src/features/schedule-management/components/GenerateScheduleModal.js
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Modal, Form, Button, Row, Col, ProgressBar, Spinner, Alert} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS} from '../../../shared/config/scheduleConstants';
import {getNextWeekStart, isValidWeekStartDate} from '../../../shared/lib/utils/scheduleUtils';
import {fetchWorkSites} from '../../../app/store/slices/scheduleSlice';
import {useI18n} from '../../../shared/lib/i18n/i18nProvider';


const GenerateScheduleModal = ({show, onHide, onGenerate, generating}) => {
    const {t, locale} = useI18n();
    const dispatch = useDispatch();

    // Получаем данные из Redux
    const {workSites, workSitesLoading} = useSelector((state) => state.schedule || {});

    // Локальное состояние для настроек формы
    const [settings, setSettings] = useState({
        ...DEFAULT_GENERATION_SETTINGS,
        weekStart: getNextWeekStart(locale),
        algorithm: 'auto' // Установим дефолтное значение
    });
    const [formError, setFormError] = useState('');

    const hasFetched = useRef(false);

    const safeWorkSites = useMemo(() => workSites || [], [workSites]);
    const safeAlgorithmTypes = useMemo(() => ALGORITHM_TYPES || [], []);


    // Эффект №1: Загрузка данных при открытии модалки
    useEffect(() => {
        if (show && !hasFetched.current) {
            dispatch(fetchWorkSites());
            hasFetched.current = true;
        }

        // Сброс при закрытии
        if (!show) {
            hasFetched.current = false;
            // Сброс настроек при закрытии модала
            setSettings({
                ...DEFAULT_GENERATION_SETTINGS,
                weekStart: getNextWeekStart()
            });
        }
    }, [show, dispatch]);

// Отдельный эффект для установки дефолтного site_id
    useEffect(() => {
        if (workSites.length > 0 && !settings.site_id) {
            setSettings(prev => ({
                ...prev,
                site_id: workSites[0].site_id
            }));
        }
    }, [workSites])


    const handleDateChange = (e) => {
        const date = e.target.value;
        setSettings(prev => ({...prev, weekStart: date}));

        if (date && !isValidWeekStartDate(date, locale)) {
            const weekStartName = locale === 'he' ? t('days.sunday') : t('days.monday');
            setFormError(t('errors.weekStartInvalid', {day: weekStartName}));
        } else {
            setFormError('');
        }
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
                <Modal.Title><i className="bi bi-plus-circle me-2"></i>{t('modal.generateSchedule.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {generating ? (
                    <div className="text-center">
                        <p>{t('modal.generateSchedule.generating')}</p>
                        <ProgressBar animated now={100} className="mb-3"/>
                        <small className="text-muted">{t('modal.generateSchedule.generating')}</small>
                    </div>
                ) : (
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('modal.generateSchedule.weekStart')}</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={settings.weekStart}
                                        onChange={handleDateChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        isInvalid={!!formError}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formError}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        {locale === 'he'
                                            ? t('modal.generateSchedule.weekStartHintSunday')
                                            : t('modal.generateSchedule.weekStartHintMonday')
                                        }
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('schedule.workSite')}</Form.Label>
                                    {workSitesLoading === 'pending' ? <Spinner size="sm"/> :
                                        <Form.Select
                                            value={settings.site_id || ''}
                                            onChange={(e) =>
                                                setSettings(prev =>
                                                    ({...prev, site_id: parseInt(e.target.value)}))
                                            }

                                        >
                                            {/* Здесь тоже используем optional chaining для 100% надежности */}
                                            {safeWorkSites?.map(site => (
                                                <option key={site.site_id}
                                                        value={site.site_id}>{site.site_name}</option>
                                            ))}
                                        </Form.Select>
                                    }
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('modal.generateSchedule.selectAlgorithm')}</Form.Label>
                            <Form.Select
                                value={settings.algorithm}
                                onChange={(e) => setSettings(prev => ({...prev, algorithm: e.target.value}))}
                                required
                            >
                                {safeAlgorithmTypes.map(algo => (
                                    <option key={algo.value} value={algo.value}>
                                        {t(`modal.generateSchedule.algorithms.${algo.value}`)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {/*{formError && <Alert variant="warning" className="mt-3">{formError}</Alert>}*/}
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={generating}>
                    {t('common.cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={generating || !isFormValid || !!formError}
                >
                    {generating ? (
                        <>
                            <Spinner size="sm" className="me-2"/>
                            {t('modal.generateSchedule.generating')}
                        </>
                    ) : (
                        <>
                            <i className="bi bi-plus-circle me-2"></i>
                            {t('modal.generateSchedule.generate')}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GenerateScheduleModal;