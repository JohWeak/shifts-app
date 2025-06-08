// frontend/src/components/admin/ScheduleDetailsEditor.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ScheduleDetailsEditor.css';

const ScheduleDetailsEditor = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    useEffect(() => {
        fetchScheduleDetails();
    }, [scheduleId]);

    const fetchScheduleDetails = async () => {
        try {
            const response = await axios.get(`/api/schedules/${scheduleId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setScheduleData(response.data.data);
            } else {
                setError('Failed to load schedule details');
            }
        } catch (err) {
            setError('Error loading schedule details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeRecommendations = async (date, shiftId, positionId) => {
        setLoadingRecommendations(true);
        try {
            const response = await axios.get('/api/schedules/recommendations/employees', {
                params: { scheduleId, date, shiftId, positionId },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setRecommendations(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleCellClick = (date, shiftId, positionId) => {
        setSelectedCell({ date, shiftId, positionId });
        setShowEmployeeModal(true);
        fetchEmployeeRecommendations(date, shiftId, positionId);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { weekday: 'long', day: 'numeric', month: 'numeric' };
        return date.toLocaleDateString('he-IL', options);
    };

    const getDatesArray = () => {
        const dates = [];
        const startDate = new Date(scheduleData.schedule.start_date);
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            published: 'success',
            archived: 'warning'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const getAvailabilityBadge = (status) => {
        const variants = {
            preferred: 'success',
            available: 'primary',
            cannot_work: 'warning',
            violates_constraints: 'danger'
        };
        const labels = {
            preferred: 'מעדיף לעבוד',
            available: 'זמין',
            cannot_work: 'לא יכול לעבוד',
            violates_constraints: 'מפר אילוצים'
        };
        return <Badge bg={variants[status]} className="me-1">{labels[status]}</Badge>;
    };

    if (loading) return <div className="text-center p-4">Loading schedule details...</div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!scheduleData) return <Alert variant="warning">No schedule data found</Alert>;

    const dates = getDatesArray();

    return (
        <Container fluid className="schedule-editor">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4>עריכת לוח זמנים - {scheduleData.schedule.work_site?.site_name}</h4>
                                <small className="text-muted">
                                    {formatDate(scheduleData.schedule.start_date)} - {formatDate(scheduleData.schedule.end_date)}
                                </small>
                            </div>
                            <div>
                                {getStatusBadge(scheduleData.schedule.status)}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="ms-2"
                                    onClick={() => navigate('/admin')}
                                >
                                    חזרה לדשבורד
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4}>
                                    <strong>סה"כ משמרות:</strong> {scheduleData.statistics.total_assignments}
                                </Col>
                                <Col md={4}>
                                    <strong>עובדים בשימוש:</strong> {scheduleData.statistics.employees_used}
                                </Col>
                                <Col md={4}>
                                    <strong>אלגוריתם:</strong> {scheduleData.schedule.metadata?.algorithm || 'N/A'}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Schedule Tables by Position */}
            {Object.entries(scheduleData.schedule_matrix).map(([positionId, positionData]) => (
                <Row key={positionId} className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header>
                                <h5>{positionData.position.name} - {positionData.position.profession}</h5>
                                <small className="text-muted">
                                    נדרש: {positionData.position.num_of_emp} עובדים לכל משמרת
                                </small>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table bordered hover className="mb-0 schedule-table">
                                        <thead>
                                        <tr className="table-dark">
                                            <th style={{ width: '120px' }}>משמרת</th>
                                            {dates.map(date => (
                                                <th key={date} className="text-center">
                                                    {formatDate(date)}
                                                </th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {scheduleData.all_shifts.map(shift => (
                                            <tr key={shift.shift_id}>
                                                <td className={`shift-${shift.shift_type} text-center fw-bold`}>
                                                    {shift.shift_name}
                                                    <br />
                                                    <small>{shift.start_time} ({shift.duration}ש)</small>
                                                </td>
                                                {dates.map(date => {
                                                    const cellData = positionData.schedule[date]?.[shift.shift_id];
                                                    const assignments = cellData?.assignments || [];
                                                    const isEmpty = assignments.length === 0;
                                                    const isUnderstaffed = assignments.length < positionData.position.num_of_emp;

                                                    return (
                                                        <td
                                                            key={`${date}-${shift.shift_id}`}
                                                            className={`schedule-cell ${isEmpty ? 'empty-cell' : ''} ${isUnderstaffed ? 'understaffed-cell' : ''}`}
                                                            onClick={() => handleCellClick(date, shift.shift_id, positionId)}
                                                            style={{ cursor: 'pointer', minHeight: '60px' }}
                                                        >
                                                            {assignments.map(assignment => (
                                                                <div key={assignment.id} className="employee-assignment">
                                                                    <small className="fw-bold">{assignment.employee.name}</small>
                                                                    {assignment.status !== 'scheduled' && (
                                                                        <Badge bg="info" size="sm" className="ms-1">
                                                                            {assignment.status}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {isEmpty && (
                                                                <div className="text-muted">
                                                                    <i className="fas fa-plus"></i> הוספת עובד
                                                                </div>
                                                            )}
                                                            {isUnderstaffed && !isEmpty && (
                                                                <div className="text-warning">
                                                                    <small>חסר {positionData.position.num_of_emp - assignments.length} עובדים</small>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ))}

            {/* Employee Selection Modal */}
            <Modal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>בחירת עובד למשמרת</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCell && (
                        <div className="mb-3">
                            <strong>תאריך:</strong> {formatDate(selectedCell.date)} <br />
                            <strong>משמרת:</strong> {scheduleData.all_shifts.find(s => s.shift_id == selectedCell.shiftId)?.shift_name}
                        </div>
                    )}

                    {loadingRecommendations ? (
                        <div className="text-center">Loading recommendations...</div>
                    ) : recommendations ? (
                        <div>
                            {/* Preferred Employees */}
                            {recommendations.recommendations.preferred.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="text-success">עובדים שמעדיפים לעבוד</h6>
                                    {recommendations.recommendations.preferred.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <br />
                                                <small className="text-muted">{emp.email}</small>
                                            </div>
                                            <div>
                                                {getAvailabilityBadge(emp.availability_status)}
                                                <Button size="sm" variant="success">בחר</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Available Employees */}
                            {recommendations.recommendations.available.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="text-primary">עובדים זמינים</h6>
                                    {recommendations.recommendations.available.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <br />
                                                <small className="text-muted">{emp.email}</small>
                                            </div>
                                            <div>
                                                {getAvailabilityBadge(emp.availability_status)}
                                                <Button size="sm" variant="primary">בחר</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Cannot Work */}
                            {recommendations.recommendations.cannot_work.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="text-warning">עובדים שלא יכולים לעבוד</h6>
                                    {recommendations.recommendations.cannot_work.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <br />
                                                <small className="text-muted">{emp.reason}</small>
                                            </div>
                                            <div>
                                                {getAvailabilityBadge(emp.availability_status)}
                                                <Button size="sm" variant="warning">בחר בכל זאת</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Violates Constraints */}
                            {recommendations.recommendations.violates_constraints.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="text-danger">עובדים שמפרים אילוצים</h6>
                                    {recommendations.recommendations.violates_constraints.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <br />
                                                <small className="text-danger">{emp.reason}</small>
                                            </div>
                                            <div>
                                                {getAvailabilityBadge(emp.availability_status)}
                                                <Button size="sm" variant="danger">בחר בכל זאת</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>No recommendations available</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEmployeeModal(false)}>
                        סגור
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ScheduleDetailsEditor;