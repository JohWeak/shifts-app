// frontend/src/features/admin-schedule-management/ui/generate-schedule/CompareAlgorithmsModal.js
import React from 'react';
import { Modal, Button, Alert, Row, Col, Card, Badge } from 'react-bootstrap';
import {useI18n} from "shared/lib/i18n/i18nProvider";
import './CompareAlgorithmsModal.css';

const CompareAlgorithmsModal = ({
                                    show,
                                    onHide,
                                    results,
                                    onUseAlgorithm
                                }) => {
    const { t } = useI18n();
    if (!results) return null;


    const { comparison, best_algorithm, recommendation } = results;

    const handleUseAlgorithm = () => {
        onUseAlgorithm(best_algorithm);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg"
               className="compare-algorithms-modal">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-speedometer2 me-2"></i>
                    {t('modal.compareAlgorithms.results')}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert variant="info" className="mb-4">
                    <h6 className="mb-2">
                        <div className="mb-0">
                        <i className="bi bi-trophy me-2"></i>
                        {t('modal.compareAlgorithms.best')}: <strong>{best_algorithm}</strong></div>
                    </h6>

                </Alert>

                <Row className="justify-content-center">
                    {Object.entries(comparison)
                        .filter(([algorithm]) => algorithm !== 'recommended')
                        .map(([algorithm, result]) => (
                            <Col md={6} lg={5} key={algorithm} className="mb-4">
                                <Card className={`h-100 ${best_algorithm === algorithm ? 'border-success' : ''}`}>
                                    <Card.Header className={`text-center ${best_algorithm === algorithm ? 'bg-success text-white' : 'bg-light'}`}>
                                        <h6 className="mb-0">
                                            {algorithm.toUpperCase()}
                                            {best_algorithm === algorithm && (
                                                <i className="bi bi-trophy ms-2"></i>
                                            )}
                                        </h6>
                                    </Card.Header>

                                    <Card.Body>
                                        <div className="mb-3">
                                            <Badge bg={result.status === 'success' ? 'success' : 'danger'} className="mb-2">
                                                {result.status}
                                            </Badge>
                                        </div>

                                        {result.status === 'success' ? (
                                            <div>
                                                <div className="mb-2">
                                                    <strong>{t('employee.assignments')}:</strong> {result.stats?.total_assignments || result.assignments_count || 0}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>{t('modal.compareAlgorithms.executionTime')}:</strong> {result.solve_time || 'N/A'}
                                                </div>
                                                {result.stats?.employees_used && (
                                                    <div className="mb-2">
                                                        <strong>{t('employee.used')}:</strong> {result.stats.employees_used}
                                                    </div>
                                                )}
                                                {result.score && result.score !== 'N/A' && (
                                                    <div className="mb-2">
                                                        <strong>Score:</strong> {result.score}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-danger">
                                                <strong>Error:</strong> {result.error}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                </Row>

                {recommendation && (
                    <Alert variant="warning" className="mt-4">
                        <h6>
                            <i className="bi bi-lightbulb me-2"></i>
                            {t('common.recommendation')}:
                        </h6>
                        <p className="mb-0">{recommendation}</p>
                    </Alert>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {best_algorithm && (
                    <Button
                        variant="primary"
                        onClick={handleUseAlgorithm}
                    >
                        {t('common.ok')}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CompareAlgorithmsModal;