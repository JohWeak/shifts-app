// frontend/src/components/admin/schedule/EmployeeSelectionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Badge, Spinner, Alert, Form, Tab, Tabs } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';
import axios from 'axios';

const EmployeeSelectionModal = ({
                                    show,
                                    onHide,
                                    selectedPosition,
                                    onEmployeeSelect,
                                    scheduleDetails
                                }) => {
    const messages = useMessages('en');
    const [recommendations, setRecommendations] = useState({
        available: [],
        cross_position: [],
        unavailable_busy: [],
        unavailable_hard: [],
        unavailable_soft: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('available');

    useEffect(() => {
        if (show && selectedPosition) {
            fetchRecommendations();
        } else {
            setRecommendations({
                available: [],
                cross_position: [],
                unavailable_busy: [],
                unavailable_hard: [],
                unavailable_soft: []
            });
            setError(null);
            setSearchTerm('');
            setActiveTab('available');
        }
    }, [show, selectedPosition]);

    const fetchRecommendations = async () => {
        if (!selectedPosition || !scheduleDetails?.schedule?.id) return;

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching recommendations for:', selectedPosition);

            const token = localStorage.getItem('token');

            // Передаем schedule_id для получения контекста всех назначений
            const response = await axios.get('http://localhost:5000/api/employees/recommendations', {
                params: {
                    position_id: selectedPosition.positionId,
                    shift_id: selectedPosition.shiftId,
                    date: selectedPosition.date,
                    schedule_id: scheduleDetails.schedule.id // Добавляем schedule_id
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-access-token': token
                }
            });

            console.log('Recommendations response:', response.data);

            if (response.data.success) {
                setRecommendations(response.data.data);

                // Автоматически переключаемся на вкладку cross-position если нет доступных
                if (response.data.data.available.length === 0 && response.data.data.cross_position.length > 0) {
                    setActiveTab('cross_position');
                } else if (response.data.data.available.length === 0 && response.data.data.cross_position.length === 0) {
                    setActiveTab('unavailable');
                }
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeSelect = (employee) => {
        console.log('Employee selected:', employee);
        onEmployeeSelect(employee.emp_id, `${employee.first_name} ${employee.last_name}`);
    };

    const filterEmployees = (employees) => {
        if (!searchTerm) return employees;
        return employees.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const getModalTitle = () => {
        if (!selectedPosition) return messages.SELECT_EMPLOYEE;

        const date = new Date(selectedPosition.date).toLocaleDateString();
        const shift = scheduleDetails?.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails?.positions?.find(p => p.pos_id === selectedPosition.positionId);

        return `${messages.SELECT_EMPLOYEE} - ${position?.pos_name} (${shift?.shift_name}, ${date})`;
    };

    const renderEmployeeList = (employees, type) => {
        const filtered = filterEmployees(employees);

        if (filtered.length === 0) {
            return (
                <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    {searchTerm ? 'No employees match your search.' : 'No employees in this category.'}
                </Alert>
            );
        }

        return (
            <ListGroup>
                {filtered.map(employee => {
                    // Все категории теперь кликабельны, но недоступные показывают предупреждение
                    const isAvailable = type === 'available' || type === 'cross_position';
                    const showWarning = !isAvailable;

                    return (
                        <ListGroup.Item
                            key={employee.emp_id}
                            action
                            onClick={() => {
                                if (showWarning) {
                                    const confirmAssign = window.confirm(
                                        `Warning! ${employee.first_name} ${employee.last_name} is marked as unavailable:\n\n` +
                                        `Reason: ${employee.unavailable_reason.replace('_', ' ')}\n` +
                                        `${employee.note || ''}\n\n` +
                                        `Are you sure you want to assign them anyway?`
                                    );
                                    if (confirmAssign) {
                                        handleEmployeeSelect(employee);
                                    }
                                } else {
                                    handleEmployeeSelect(employee);
                                }
                            }}
                            className={`d-flex justify-content-between align-items-center ${showWarning ? 'list-group-item-warning' : ''}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <div>
                                <div className="fw-bold">
                                    {employee.first_name} {employee.last_name}
                                </div>
                                <small className="text-muted">
                                    ID: {employee.emp_id} |
                                    Position: {employee.default_position_name || employee.defaultPosition?.pos_name || 'No position'}
                                </small>

                                {employee.recommendation?.reasons && employee.recommendation.reasons.length > 0 && (
                                    <div className="mt-1">
                                        {employee.recommendation.reasons.map((reason, idx) => (
                                            <small key={idx} className="d-block text-success">
                                                <i className="bi bi-check-circle me-1"></i>{reason}
                                            </small>
                                        ))}
                                    </div>
                                )}

                                {employee.recommendation?.warnings && employee.recommendation.warnings.length > 0 && (
                                    <div className="mt-1">
                                        {employee.recommendation.warnings.map((warning, idx) => (
                                            <small key={idx} className="d-block text-danger">
                                                <i className="bi bi-exclamation-triangle me-1"></i>{warning}
                                            </small>
                                        ))}
                                    </div>
                                )}

                                {employee.note && (
                                    <small className="d-block text-danger mt-1 fw-bold">
                                        <i className="bi bi-exclamation-circle me-1"></i>
                                        {employee.note}
                                    </small>
                                )}

                                {employee.constraint_details && employee.constraint_details.length > 0 && (
                                    <div className="mt-1">
                                        {employee.constraint_details.map((constraint, idx) => (
                                            <small key={idx} className="d-block text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                {constraint.reason || 'Constraint applied'}
                                            </small>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex flex-column align-items-end">
                                {type === 'available' && (
                                    <Badge bg="success">
                                        Available
                                    </Badge>
                                )}
                                {type === 'cross_position' && (
                                    <Badge bg="warning" text="dark">
                                        Cross-Position
                                    </Badge>
                                )}
                                {showWarning && (
                                    <>
                                        <Badge bg="danger">
                                            Unavailable
                                        </Badge>
                                        <small className="text-danger mt-1">
                                            <i className="bi bi-exclamation-triangle"></i> Click to override
                                        </small>
                                    </>
                                )}

                                {employee.recommendation?.score && (
                                    <small className="text-muted mt-1">
                                        Score: {employee.recommendation.score}
                                    </small>
                                )}
                            </div>
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="employee-selection-modal">
            <Modal.Header closeButton>
                <Modal.Title>{getModalTitle()}</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                    />
                </Form.Group>

                {loading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                        <div className="mt-2">Loading recommendations...</div>
                    </div>
                )}

                {error && (
                    <Alert variant="danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {!loading && !error && (
                    <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                        <Tab
                            eventKey="available"
                            title={
                                <span>
                                    Available
                                    <Badge bg="secondary" className="ms-2">
                                        {recommendations.available.length}
                                    </Badge>
                                </span>
                            }
                        >
                            {renderEmployeeList(recommendations.available, 'available')}
                        </Tab>

                        <Tab
                            eventKey="cross_position"
                            title={
                                <span>
                                    Cross-Position
                                    <Badge bg="secondary" className="ms-2">
                                        {recommendations.cross_position.length}
                                    </Badge>
                                </span>
                            }
                        >
                            <Alert variant="warning" className="mb-3">
                                <i className="bi bi-info-circle me-2"></i>
                                These employees have a different primary position but can be assigned if needed.
                            </Alert>
                            {renderEmployeeList(recommendations.cross_position, 'cross_position')}
                        </Tab>

                        <Tab
                            eventKey="unavailable"
                            title={
                                <span>
                                    Unavailable
                                    <Badge bg="secondary" className="ms-2">
                                        {recommendations.unavailable_busy.length +
                                            recommendations.unavailable_hard.length +
                                            recommendations.unavailable_soft.length}
                                    </Badge>
                                </span>
                            }
                        >
                            {recommendations.unavailable_busy.length > 0 && (
                                <>
                                    <h6 className="mb-3">Already Working / Rest Violations</h6>
                                    {renderEmployeeList(recommendations.unavailable_busy, 'unavailable_busy')}
                                    <hr className="my-3" />
                                </>
                            )}

                            {recommendations.unavailable_hard.length > 0 && (
                                <>
                                    <h6 className="mb-3">Cannot Work (Constraints)</h6>
                                    {renderEmployeeList(recommendations.unavailable_hard, 'unavailable_hard')}
                                    {recommendations.unavailable_soft.length > 0 && <hr className="my-3" />}
                                </>
                            )}

                            {recommendations.unavailable_soft.length > 0 && (
                                <>
                                    <h6 className="mb-3">Prefer Different Time</h6>
                                    {renderEmployeeList(recommendations.unavailable_soft, 'unavailable_soft')}
                                </>
                            )}
                        </Tab>
                    </Tabs>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {messages.CANCEL || 'Cancel'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeSelectionModal;