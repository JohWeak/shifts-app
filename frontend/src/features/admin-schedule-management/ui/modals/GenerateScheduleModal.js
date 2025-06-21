// frontend/src/features/admin-schedule-management/ui/modals/GenerateScheduleModal.js
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Modal, Form, Button, Row, Col, ProgressBar, Spinner, Alert} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS} from 'shared/config/scheduleConstants';
import {getNextWeekStart, isValidWeekStartDate, ensureValidWeekStart} from 'shared/lib/utils/scheduleUtils';
import {fetchWorkSites, compareAlgorithms} from '../../model/scheduleSlice';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import DatePicker from 'shared/ui/components/DatePicker/DatePicker';
import CompareAlgorithmsModal from './CompareAlgorithmsModal';
import './GenerateScheduleModal.css';

const GenerateScheduleModal = ({show, onHide, onGenerate, generating}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    // Redux state
    const {workSites, workSitesLoading} = useSelector((state) => state.schedule || {});
    const { systemSettings } = useSelector(state => state.settings);
    const weekStartDay = systemSettings?.weekStartDay || 0;

    // Local state
    const [settings, setSettings] = useState({
        ...DEFAULT_GENERATION_SETTINGS,
        weekStart: getNextWeekStart(weekStartDay),
        algorithm: 'auto'
    });

    const [formError, setFormError] = useState('');
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [isComparing, setIsComparing] = useState(false);
    const [isAutoSelecting, setIsAutoSelecting] = useState(false);

    const hasFetched = useRef(false);

    const safeWorkSites = useMemo(() => workSites || [], [workSites]);
    const safeAlgorithmTypes = useMemo(() => ALGORITHM_TYPES || [], []);

    // Load data when modal opens
    useEffect(() => {
        if (show && !hasFetched.current) {
            dispatch(fetchWorkSites());
            hasFetched.current = true;
        }

        // Reset on close
        if (!show) {
            hasFetched.current = false;
            setSettings({
                ...DEFAULT_GENERATION_SETTINGS,
                weekStart: getNextWeekStart(weekStartDay),
                site_id: settings.site_id
            });
            setFormError('');
            setComparisonResults(null);
            setIsAutoSelecting(false);
        }
    }, [show, dispatch, weekStartDay, settings.site_id]);

    // Set default site_id
    useEffect(() => {
        if (safeWorkSites.length > 0 && !settings.site_id) {
            setSettings(prev => ({
                ...prev,
                site_id: safeWorkSites[0].site_id
            }));
        }
    }, [safeWorkSites, settings.site_id]);

    // Validate week start date
    useEffect(() => {
        if (!isValidWeekStartDate(settings.weekStart, weekStartDay)) {
            const weekStartName = weekStartDay === 1 ? t('weekDays.monday') : t('weekDays.sunday');
            setFormError(t('schedule.weekStartWarning', { day: weekStartName }));
        } else {
            setFormError('');
        }
    }, [settings.weekStart, weekStartDay, t]);

    // Handle date change - automatically adjust to valid week start
    const handleDateChange = (selectedDate) => {
        if (!selectedDate) {
            setSettings(prev => ({ ...prev, weekStart: selectedDate }));
            return;
        }

        // Ensure the selected date is adjusted to the correct week start day
        const validWeekStart = ensureValidWeekStart(selectedDate, weekStartDay);
        setSettings(prev => ({ ...prev, weekStart: validWeekStart }));
    };

    const handleCompareAlgorithms = async () => {
        setIsComparing(true);
        try {
            const compareSettings = {
                site_id: settings.site_id,
                week_start: settings.weekStart
            };
            const result = await dispatch(compareAlgorithms(compareSettings)).unwrap();
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

    const handleAutoSelection = async () => {
        setIsAutoSelecting(true);
        try {
            const compareSettings = {
                site_id: settings.site_id,
                week_start: settings.weekStart
            };
            const result = await dispatch(compareAlgorithms(compareSettings)).unwrap();

            // Auto-select the best algorithm
            const bestAlgorithm = result.best_algorithm || result.comparison?.recommended || 'simple';
            setSettings(prev => ({ ...prev, algorithm: bestAlgorithm }));

            // Store comparison results for potential display
            setComparisonResults(result);

        } catch (error) {
            console.error('Error during auto algorithm selection:', error);
            // Fallback to simple algorithm
            setSettings(prev => ({ ...prev, algorithm: 'simple' }));
        } finally {
            setIsAutoSelecting(false);
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!isFormValid) return;

        // Ensure we have a valid week start date before submitting
        const finalWeekStart = ensureValidWeekStart(settings.weekStart, weekStartDay);

        // If 'auto' is selected, first perform auto-selection
        if (settings.algorithm === 'auto') {
            try {
                const compareSettings = {
                    site_id: settings.site_id,
                    week_start: finalWeekStart
                };
                const result = await dispatch(compareAlgorithms(compareSettings)).unwrap();
                const bestAlgorithm = result.best_algorithm || result.comparison?.recommended || 'simple';

                const finalSettings = {
                    ...settings,
                    weekStart: finalWeekStart,
                    algorithm: bestAlgorithm
                };
                onGenerate(finalSettings);
            } catch (error) {
                console.error('Error during auto-selection:', error);
                // Fallback to simple algorithm
                const finalSettings = {
                    ...settings,
                    weekStart: finalWeekStart,
                    algorithm: 'simple'
                };
                onGenerate(finalSettings);
            }
        } else {
            const finalSettings = {
                ...settings,
                weekStart: finalWeekStart
            };
            onGenerate(finalSettings);
        }
    };

    const isFormValid = settings.site_id && settings.weekStart && settings.algorithm && !formError;
    const isProcessing = generating || isAutoSelecting;

    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                backdrop={isProcessing ? 'static' : true}
                keyboard={!isProcessing}
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
                    {isProcessing ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" size="lg" className="mb-3" />
                            <h5>
                                {generating && t('modal.generateSchedule.generating')}
                                {isAutoSelecting && t('modal.generateSchedule.autoSelecting')}
                            </h5>
                            <p className="text-muted">{t('modal.generateSchedule.pleaseWait')}</p>
                            <ProgressBar animated now={100} className="mt-4" />
                        </div>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="weekStart">
                                        <Form.Label>{t('modal.generateSchedule.weekStart')}</Form.Label>
                                        <DatePicker
                                            value={settings.weekStart}
                                            onChange={handleDateChange}
                                            minDate={new Date()}
                                            placeholder={t('schedule.selectStartDate')}
                                            dateFormat="dd.MM.yyyy"
                                            isInvalid={!!formError}
                                        />
                                        <Form.Control.Feedback type="invalid">{formError}</Form.Control.Feedback>
                                        <Form.Text className="text-muted">
                                            {weekStartDay === 1
                                                ? t('modal.generateSchedule.weekStartHintMonday')
                                                : t('modal.generateSchedule.weekStartHintSunday')
                                            }
                                        </Form.Text>
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
                                                {safeWorkSites?.map(site => (
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
                                        disabled={isComparing || !settings.site_id || !settings.weekStart}
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
                                <Form.Text className="text-muted">
                                    {settings.algorithm === 'auto' && t('modal.generateSchedule.autoDesc')}
                                    {settings.algorithm === 'cp-sat' && t('modal.generateSchedule.cpSatDesc')}
                                    {settings.algorithm === 'simple' && t('modal.generateSchedule.simpleDesc')}
                                </Form.Text>
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={onHide}
                        disabled={isProcessing}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isProcessing || !isFormValid || !!formError}
                    >
                        {isProcessing ? (
                            <>
                                <Spinner size="sm" className="me-2"/>
                                {generating && t('modal.generateSchedule.generating')}
                                {isAutoSelecting && t('modal.generateSchedule.autoSelecting')}
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