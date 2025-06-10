// frontend/src/components/admin/schedule/EmployeeSelectionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';
import { useScheduleAPI } from '../../../hooks/useScheduleAPI';

const EmployeeSelectionModal = ({
                                    show,
                                    onHide,
                                    selectedPosition,
                                    onEmployeeSelect,
                                    scheduleDetails
                                }) => {
    const messages = useMessages('en');
    const api = useScheduleAPI();

    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch available employees when modal opens
    useEffect(() => {
        if (show && selectedPosition) {
            fetchAvailableEmployees();
        } else {
            // Reset state when modal closes
            setAvailableEmployees([]);
            setError(null);
            setSearchTerm('');
        }
    }, [show, selectedPosition]);

    const fetchAvailableEmployees = async () => {
        if (!selectedPosition) return;

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching available employees for:', selectedPosition);

            // For now, we'll use all employees from scheduleDetails
            // In a real app, this would filter based on availability, constraints, etc.
            const employees = scheduleDetails?.employees || [];

            // Filter out employees already assigned to this shift
            const currentAssignments = scheduleDetails?.assignments?.filter(assignment =>
                assignment.position_id === selectedPosition.positionId &&
                assignment.shift_id === selectedPosition.shiftId &&
                assignment.work_date === selectedPosition.date
            ) || [];

            const assignedEmployeeIds = currentAssignments.map(a => a.emp_id);
            const available = employees.filter(emp => !assignedEmployeeIds.includes(emp.emp_id));

            setAvailableEmployees(available);
        } catch (err) {
            console.error('Error fetching available employees:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeSelect = (employee) => {
        console.log('Employee selected:', employee);
        onEmployeeSelect(employee.emp_id, `${employee.first_name} ${employee.last_name}`);
    };

    // Filter employees based on search term
    const filteredEmployees = availableEmployees.filter(employee =>
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getModalTitle = () => {
        if (!selectedPosition) return messages.SELECT_EMPLOYEE;

        const date = new Date(selectedPosition.date).toLocaleDateString();
        const shift = scheduleDetails?.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails?.positions?.find(p => p.pos_id === selectedPosition.positionId);

        return `${messages.SELECT_EMPLOYEE} - ${position?.pos_name} (${shift?.shift_name}, ${date})`;
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{getModalTitle()}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Search Filter */}
                <Form.Group className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                    />
                </Form.Group>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                        <div className="mt-2">{messages.LOADING_EMPLOYEES}</div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Alert variant="danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* No Employees Available */}
                {!loading && !error && filteredEmployees.length === 0 && (
                    <Alert variant="info">
                        <i className="bi bi-info-circle me-2"></i>
                        {searchTerm ? 'No employees match your search.' : messages.NO_AVAILABLE_EMPLOYEES}
                    </Alert>
                )}

                {/* Employee List */}
                {!loading && !error && filteredEmployees.length > 0 && (
                    <ListGroup>
                        {filteredEmployees.map(employee => (
                            <ListGroup.Item
                                key={employee.emp_id}
                                action
                                onClick={() => handleEmployeeSelect(employee)}
                                className="d-flex justify-content-between align-items-center"
                                style={{ cursor: 'pointer' }}
                            >
                                <div>
                                    <div className="fw-bold">
                                        {employee.first_name} {employee.last_name}
                                    </div>
                                    <small className="text-muted">
                                        ID: {employee.emp_id} | Status: {employee.status}
                                    </small>
                                </div>
                                <div>
                                    <Badge bg="success">
                                        {messages.AVAILABLE}
                                    </Badge>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {messages.CANCEL}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeSelectionModal;