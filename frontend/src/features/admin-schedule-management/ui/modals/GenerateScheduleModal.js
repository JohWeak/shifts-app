// frontend/src/features/admin-schedule-management/components/GenerateScheduleModal.js
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Modal, Form, Button, Row, Col, ProgressBar, Spinner, Alert} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS} from 'shared/config/scheduleConstants';
import {getNextWeekStart, isValidWeekStartDate} from 'shared/lib/utils/scheduleUtils';
import {fetchWorkSites, compareAlgorithms} from '../../model/scheduleSlice';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import DatePicker from 'shared/ui/components/DatePicker/DatePicker';
import CompareAlgorithmsModal from './CompareAlgorithmsModal';
import './GenerateScheduleModal.css';


const GenerateScheduleModal = ({show, onHide, onGenerate, generating}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    // Получаем данные из Redux
    const {workSites, workSitesLoading} = useSelector((state) => state.schedule || {});
    const { systemSettings } = useSelector(state => state.settings);
    const weekStartDay = systemSettings?.weekStartDay || 0;

    // Локальное состояние для настроек формы
    const [settings, setSettings] = useState({
        ...DEFAULT_GENERATION_SETTINGS,
        weekStart: getNextWeekStart(weekStartDay),
        algorithm: 'auto'
    });

    const [formError, setFormError] = useState('');
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [isComparing, setIsComparing] = useState(false);

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
                weekStart: getNextWeekStart(weekStartDay),
                site_id: settings.site_id
            });
            setFormError('');
            setComparisonResults(null);
        }
    }, [show, dispatch, weekStartDay, settings.site_id]);

    // Отдельный эффект для установки дефолтного site_id
    useEffect(() => {
        const activeWorkSites = safeWorkSites.filter(site => site.is_active);
        if (activeWorkSites.length > 0 && !settings.site_id) {
            setSettings(prev => ({
                ...prev,
                site_id: activeWorkSites[0].site_id
            }));
        }
    }, [safeWorkSites, settings.site_id]);

    // Отдельный эффект для валидации даты
    useEffect(() => {
        if (!isValidWeekStartDate(settings.weekStart, weekStartDay)) {
            const weekStartName = weekStartDay === 1 ? t('weekDays.monday') : t('weekDays.sunday');
            setFormError(t('schedule.weekStartWarning', { day: weekStartName }));
        } else {
            setFormError('');
        }
    }, [settings.weekStart, weekStartDay, t]);


    const handleCompareAlgorithms = async () => {
        setIsComparing(true);
        try {
            const result = await dispatch(compareAlgorithms({ site_id: settings.site_id })).unwrap();
            setComparisonResults(result);
            setShowComparisonModal(true);
        } catch (error) {
            console.error('Error comparing algorithms:', error);
        } finally {
            setIsComparing(false);
        }
    };

    const handleUseAlgorithm = (algorithm) => {
        setSettings(prev => ({ ...prev, algorithm }));
        setShowComparisonModal(false);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (!isFormValid) return;
        onGenerate(settings);
    };

    const isFormValid = settings.site_id && settings.weekStart && settings.algorithm && !formError;


    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                backdrop={generating ? 'static' : true}
                keyboard={!generating}
                size="lg"
                className="generate-schedule-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-plus-circle me-2"></i>
                        {t('modal.generateSchedule.title')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {generating ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" size="lg" className="mb-3" />
                            <h5>{t('modal.generateSchedule.generating')}</h5>
                            <p className="text-muted">{t('modal.generateSchedule.pleaseWait')}</p>
                            <ProgressBar animated now={100} className="mt-4" />
                        </div>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            {/* ИЗМЕНЕНА СТРУКТУРА ДЛЯ КОРРЕКТНОЙ ШИРИНЫ */}
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="weekStart">
                                        <Form.Label>{t('modal.generateSchedule.weekStart')}</Form.Label>
                                        <DatePicker
                                            value={settings.weekStart}
                                            onChange={(date) => setSettings(prev => ({ ...prev, weekStart: date }))}
                                            minDate={new Date()}
                                            placeholder={t('schedule.selectStartDate')}
                                            dateFormat="dd.MM.yyyy"
                                            isInvalid={!!formError}
                                        />
                                        <Form.Control.Feedback type="invalid">{formError}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>{t('modal.generateSchedule.workSite')}</Form.Label>
                                        {workSitesLoading === 'pending' ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <Form.Select
                                                value={settings.site_id || ''}
                                                onChange={(e) => setSettings(prev => ({ ...prev, site_id: parseInt(e.target.value) }))}
                                            >
                                                {safeWorkSites
                                                    ?.filter(site => site.is_active)
                                                    .map(site => (
                                                    <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="mb-0">{t('modal.generateSchedule.selectAlgorithm')}</Form.Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCompareAlgorithms}
                                        disabled={isComparing}
                                    >
                                        {isComparing ? (
                                            <Spinner size="sm" className="me-2" />
                                        ) : (
                                            <i className="bi bi-speedometer2 me-2"></i>
                                        )}
                                        {t('schedule.compareAlgorithms')}
                                    </Button>
                                </div>
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

            <CompareAlgorithmsModal
                show={showComparisonModal}
                onHide={() => setShowComparisonModal(false)}
                results={comparisonResults}
                onUseAlgorithm={handleUseAlgorithm}
            />
        </>
    );
};

export default GenerateScheduleModal;