// frontend/src/components/admin/schedule/GenerateScheduleModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, ProgressBar } from 'react-bootstrap';
import { MESSAGES } from '../../../i18n/messages';
import { ALGORITHM_TYPES, DEFAULT_GENERATION_SETTINGS } from '../../../constants/scheduleConstants';
import { useScheduleAPI } from '../../../hooks/useScheduleAPI';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { isValidWeekStartDate, getNextSunday } from '../../../utils/scheduleUtils';

const GenerateScheduleModal = ({
                                   show,
                                   onHide,
                                   onGenerate,
                                   generating = false
                               }) => {
    const [settings, setSettings] = useState(DEFAULT_GENERATION_SETTINGS);
    const [workSites, setWorkSites] = useState([]);
    const [modalAlert, setModalAlert] = useState(null);
    const [isValidWeekStart, setIsValidWeekStart] = useState(true);

    const api = useScheduleAPI();

    useEffect(() => {
        if (show) {
            initializeModal();
        }
    }, [show]);

    const initializeModal = async () => {
        // Set default week start
        setSettings(prev => ({
            ...prev,
            weekStart: getNextSunday()
        }));
        setIsValidWeekStart(true);

        // Fetch work sites
        await fetchWorkSites();
    };

    const fetchWorkSites = async () => {
        try {
            const sites = await api.fetchWorkSites();
            setWorkSites(sites);

            // Set first site as default if none selected
            if (sites.length > 0 && !settings.site_id) {
                setSettings(prev => ({
                    ...prev,
                    site_id: sites[0].site_id
                }));
            }
        } catch (err) {
            setModalAlert({
                type: 'warning',
                message: MESSAGES.COULD_NOT_LOAD_WORK_SITES
            });
        }
    };

    const handleDateChange = (e) => {
        const isValid = isValidWeekStartDate(e.target.value);

        setIsValidWeekStart(isValid);
        setModalAlert(null);

        if (!isValid && e.target.value) {
            setModalAlert({
                type: 'warning',
                message: MESSAGES.WEEK_START_SUNDAY_WARNING
            });
        }

        setSettings(prev => ({
            ...prev,
            weekStart: e.target.value
        }));
    };

    const handleSubmit = () => {
        onGenerate(settings);
    };

    const handleClose = () => {
        setModalAlert(null);
        setIsValidWeekStart(true);
        onHide();
    };

    const isFormValid = () => {
        return settings.weekStart &&
            isValidWeekStart &&
            !api.loading &&
            workSites.length > 0;
    };

    return (
        <Modal
            show={show}
            onHide={!generating ? handleClose : undefined}
            size="lg"
            className="generation-modal"
        >
            <Modal.Header closeButton={!generating}>
                <Modal.Title>
                    <i className="bi bi-plus-circle me-2"></i>
                    {MESSAGES.GENERATE_SCHEDULE}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    <i className="bi bi-calendar me-2"></i>
                                    {MESSAGES.WEEK_START_DATE}
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={settings.weekStart}
                                    onChange={handleDateChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={!isValidWeekStart && settings.weekStart ? 'is-invalid' : ''}
                                />
                                <Form.Text className="text-muted">
                                    {MESSAGES.FUTURE_DATES_ONLY}
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    <i className="bi bi-building me-2"></i>
                                    {MESSAGES.WORK_SITE}
                                </Form.Label>
                                {api.loading ? (
                                    <LoadingSpinner message={MESSAGES.LOADING_WORK_SITES} className="py-2" />
                                ) : (
                                    <Form.Select
                                        value={settings.site_id}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            site_id: parseInt(e.target.value)
                                        }))}
                                    >
                                        {workSites.length === 0 ? (
                                            <option value="">{MESSAGES.NO_WORK_SITES}</option>
                                        ) : (
                                            workSites.map(site => (
                                                <option key={site.site_id} value={site.site_id}>
                                                    {site.site_name}
                                                </option>
                                            ))
                                        )}
                                    </Form.Select>
                                )}
                                <Form.Text className="text-muted">
                                    {MESSAGES.SELECT_WORK_SITE}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                            <i className="bi bi-cpu me-2"></i>
                            {MESSAGES.ALGORITHM}
                        </Form.Label>
                        <Form.Select
                            value={settings.algorithm}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                algorithm: e.target.value
                            }))}
                        >
                            <option value={ALGORITHM_TYPES.AUTO}>
                                {MESSAGES.ALGORITHM_AUTO_DESC}
                            </option>
                            <option value={ALGORITHM_TYPES.CP_SAT}>
                                {MESSAGES.ALGORITHM_CP_SAT_DESC}
                            </option>
                            <option value={ALGORITHM_TYPES.SIMPLE}>
                                {MESSAGES.ALGORITHM_SIMPLE_DESC}
                            </option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                            {MESSAGES.ALGORITHM_HELP}
                        </Form.Text>
                    </Form.Group>
                </Form>

                <AlertMessage
                    alert={modalAlert}
                    onClose={() => setModalAlert(null)}
                    className="mt-3 mb-0"
                />

                {/* Generation Progress */}
                {generating && (
                    <div className="mt-4">
                        <div className="d-flex align-items-center mb-2">
                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                            <span>{MESSAGES.GENERATION_IN_PROGRESS}</span>
                        </div>
                        <ProgressBar
                            animated
                            now={100}
                            variant="primary"
                            className="mb-3"
                        />
                        <div className="alert alert-info mb-0">
                            <small>
                                <i className="bi bi-info-circle me-1"></i>
                                {MESSAGES.GENERATION_INFO}
                            </small>
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="flex-column">
                <div className="d-flex gap-2 w-100 justify-content-end">
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={generating}
                    >
                        {MESSAGES.CANCEL}
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={generating || !isFormValid()}
                    >
                        {generating ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-2" role="status" />
                                {MESSAGES.GENERATING}
                            </>
                        ) : (
                            <>
                                <i className="bi bi-play-fill me-2"></i>
                                {MESSAGES.GENERATE_SCHEDULE}
                            </>
                        )}
                    </Button>
                </div>

                {/* Help text */}
                {(!isFormValid() || modalAlert) && (
                    <div className="w-100 text-center mt-2">
                        {!isValidWeekStart && settings.weekStart && (
                            <small className="text-danger d-block">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {MESSAGES.SELECT_SUNDAY_TO_ENABLE}
                            </small>
                        )}

                        {workSites.length === 0 && !api.loading && (
                            <small className="text-danger d-block">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {MESSAGES.NO_WORK_SITES_AVAILABLE}
                            </small>
                        )}
                    </div>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default GenerateScheduleModal;