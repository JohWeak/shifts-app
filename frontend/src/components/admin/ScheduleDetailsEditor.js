// frontend/src/components/admin/ScheduleDetailsEditor.js
import React, {useState, useEffect} from 'react';
import {Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge} from 'react-bootstrap';
import {useParams, useNavigate, useSearchParams} from 'react-router-dom';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import './ScheduleDetailsEditor.css';

const ScheduleDetailsEditor = () => {
    const {scheduleId} = useParams();
    const [searchParams] = useSearchParams();
    const focusPositionId = searchParams.get('position'); // Получаем ID позиции из URL
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

    useEffect(() => {
        if (scheduleData && focusPositionId) {
            // Автоматически скроллить к позиции или выделить её
            const element = document.getElementById(`position-${focusPositionId}`);
            if (element) {
                element.scrollIntoView({behavior: 'smooth'});
                element.style.border = '2px solid #0d6efd';
                setTimeout(() => {
                    element.style.border = '';
                }, 3000);
            }
        }
    }, [scheduleData, focusPositionId]);

    const fetchScheduleDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/schedules/${scheduleId}`, {
                headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
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
                params: {scheduleId, date, shiftId, positionId},
                headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}
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
        setSelectedCell({date, shiftId, positionId});
        setShowEmployeeModal(true);
        fetchEmployeeRecommendations(date, shiftId, positionId);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = {weekday: 'long', day: 'numeric', month: 'numeric'};
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
        <AdminLayout>
            <Container fluid className="schedule-editor">
                {/* Header */}
                <Row className="mb-4">
                    <Col>
                        <Card className="border-0 bg-light">
                            <Card.Header className="bg-transparent border-0 pb-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <i className="bi bi-info-circle me-2 text-primary"></i>
                                    Schedule Information
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={2} className="mb-3">
                                        <div className="small text-muted mb-1">Status</div>
                                        <div>{getStatusBadge(scheduleData.schedule.status)}</div>
                                    </Col>
                                    <Col md={2} className="mb-3">
                                        <div className="small text-muted mb-1">Total Assignments</div>
                                        <div className="h4 mb-0 text-primary">{scheduleData.statistics.total_assignments}</div>
                                    </Col>
                                    <Col md={2} className="mb-3">
                                        <div className="small text-muted mb-1">Employees Used</div>
                                        <div className="h5 mb-0">{scheduleData.statistics.employees_used}</div>
                                    </Col>
                                    <Col md={3} className="mb-3">
                                        <div className="small text-muted mb-1">Algorithm</div>
                                        <div className="small">{scheduleData.schedule.metadata?.algorithm || 'N/A'}</div>
                                    </Col>
                                    <Col md={3} className="mb-3">
                                        <div className="small text-muted mb-1">Week Period</div>
                                        <div className="small">
                                            {new Date(scheduleData.schedule.start_date).toLocaleDateString('en-US')} - {new Date(scheduleData.schedule.end_date).toLocaleDateString('en-US')}
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Schedule Tables by Position */}
                {scheduleData.schedule_matrix && Object.entries(scheduleData.schedule_matrix)
                    .filter(([positionId]) => !focusPositionId || positionId === focusPositionId)
                    .map(([positionId, positionData]) => (
                        <Row key={positionId} className="mb-4" id={`position-${positionId}`}>
                            <Col>
                                <Card className="border-0">
                                    <Card.Header className="bg-light border-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <i className="bi bi-calendar-week me-2 text-primary"></i>
                                                    {positionData.position.name} - {positionData.position.profession}
                                                </h5>
                                                <small className="text-muted">
                                                    Required: {positionData.position.num_of_emp} employees per shift
                                                </small>
                                            </div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => navigate('/admin/schedules')}
                                            >
                                                <i className="bi bi-arrow-left me-1"></i>
                                                Back to Schedules
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <div className="table-responsive">
                                            <Table bordered hover className="mb-0 schedule-table">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '120px' }}>Shift</th>
                                                    {dates.map(date => {
                                                        const dayName = new Date(date).toLocaleDateString('en-US', {weekday: 'short'});
                                                        const dayMonth = new Date(date).toLocaleDateString('en-US', {day: '2-digit', month: '2-digit'});
                                                        return (
                                                            <th key={date} className="text-center">
                                                                {dayName} {dayMonth}
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {scheduleData.all_shifts.map(shift => (
                                                    <tr key={shift.shift_id}>
                                                        <td className={`shift-${shift.shift_type} text-center fw-bold`}>
                                                            {shift.shift_name}
                                                            <br />
                                                            <small>{shift.start_time} ({shift.duration}h)</small>
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
                                                                            <i className="bi bi-plus-circle"></i> Add Employee
                                                                        </div>
                                                                    )}
                                                                    {isUnderstaffed && !isEmpty && (
                                                                        <div className="text-warning">
                                                                            <small>Need {positionData.position.num_of_emp - assignments.length} more</small>
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
                                <strong>תאריך:</strong> {formatDate(selectedCell.date)} <br/>
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
                                            <div key={emp.emp_id}
                                                 className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                                                <div>
                                                    <strong>{emp.name}</strong>
                                                    <br/>
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
                                            <div key={emp.emp_id}
                                                 className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                                                <div>
                                                    <strong>{emp.name}</strong>
                                                    <br/>
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
                                            <div key={emp.emp_id}
                                                 className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
                                                <div>
                                                    <strong>{emp.name}</strong>
                                                    <br/>
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
                                            <div key={emp.emp_id}
                                                 className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
                                                <div>
                                                    <strong>{emp.name}</strong>
                                                    <br/>
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
        </AdminLayout>
    );
};

export default ScheduleDetailsEditor;