// frontend/src/components/admin/schedule/CompareAlgorithmsModal.js
import React from 'react';
import { Modal, Button, Table, Badge, Alert } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';

const CompareAlgorithmsModal = ({ show, onHide, results, onUseAlgorithm }) => {
    const messages = useMessages('en');

    const getAlgorithmBadge = (algorithm) => {
        const variants = {
            'cp-sat': 'primary',
            'simple': 'success',
            'auto': 'info'
        };
        return <Badge bg={variants[algorithm] || 'secondary'}>{algorithm}</Badge>;
    };

    const formatExecutionTime = (time) => {
        if (!time) return 'N/A';
        return `${time}ms`;
    };

    const formatCoverage = (assignments, total) => {
        if (!total) return 'N/A';
        const percentage = Math.round((assignments / total) * 100);
        return `${percentage}%`;
    };

    const getBestAlgorithm = () => {
        if (!results) return null;

        // Simple logic to determine best algorithm
        const algorithms = Object.keys(results).filter(key => key !== 'recommended');
        if (algorithms.length === 0) return null;

        // Find algorithm with highest assignment count and success
        let best = algorithms[0];
        let bestScore = 0;

        algorithms.forEach(alg => {
            const result = results[alg];
            if (result.success) {
                const score = result.assignments || 0;
                if (score > bestScore) {
                    bestScore = score;
                    best = alg;
                }
            }
        });

        return best;
    };

    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-speedometer2 me-2"></i>
                    {messages.COMPARE_ALGORITHMS}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {!results ? (
                    <div className="text-center py-4">
                        <div className="spinner-border mb-3" role="status"></div>
                        <h5>{messages.COMPARING}</h5>
                        <p className="text-muted">{messages.GENERATION_INFO}</p>
                    </div>
                ) : (
                    <>
                        <Alert variant="info" className="mb-4">
                            <h6 className="mb-2">
                                <i className="bi bi-info-circle me-2"></i>
                                {messages.ALGORITHM_COMPARISON_RESULTS}
                            </h6>
                            <p className="mb-0">{messages.BEST_ALGORITHM_INFO}</p>
                        </Alert>

                        <Table responsive striped>
                            <thead>
                            <tr>
                                <th>{messages.ALGORITHM}</th>
                                <th>{messages.STATUS}</th>
                                <th>{messages.ASSIGNMENTS}</th>
                                <th>{messages.EXECUTION_TIME}</th>
                                <th>{messages.COVERAGE}</th>
                                <th className="text-center">{messages.ACTIONS}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(results)
                                .filter(([key]) => key !== 'recommended')
                                .map(([algorithm, result]) => (
                                    <tr key={algorithm} className={getBestAlgorithm() === algorithm ? 'table-success' : ''}>
                                        <td>
                                            {getAlgorithmBadge(algorithm)}
                                            {getBestAlgorithm() === algorithm && (
                                                <Badge bg="warning" className="ms-2">
                                                    {messages.BEST_ALGORITHM}
                                                </Badge>
                                            )}
                                        </td>
                                        <td>
                                            {result.success ? (
                                                <Badge bg="success">Success</Badge>
                                            ) : (
                                                <Badge bg="danger">Failed</Badge>
                                            )}
                                        </td>
                                        <td>{result.assignments || 0}</td>
                                        <td>{formatExecutionTime(result.execution_time)}</td>
                                        <td>{formatCoverage(result.assignments, result.total_slots)}</td>
                                        <td className="text-center">
                                            <Button
                                                variant={getBestAlgorithm() === algorithm ? 'success' : 'outline-primary'}
                                                size="sm"
                                                onClick={() => onUseAlgorithm(algorithm)}
                                                disabled={!result.success}
                                            >
                                                <i className="bi bi-check-circle me-1"></i>
                                                {messages.SELECT}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {results.recommended && (
                            <Alert variant="success">
                                <strong>{messages.RECOMMENDATION}:</strong> {results.recommended}
                            </Alert>
                        )}
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {messages.CANCEL}
                </Button>
                {results && getBestAlgorithm() && (
                    <Button
                        variant="primary"
                        onClick={() => onUseAlgorithm(getBestAlgorithm())}
                    >
                        <i className="bi bi-rocket me-2"></i>
                        {messages.USE_ALGORITHM.replace('{algorithm}', getBestAlgorithm())}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CompareAlgorithmsModal;