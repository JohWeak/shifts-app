// frontend/src/components/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleDetails, setScheduleDetails] = useState(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/schedules', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setSchedules(result.data);
            } else {
                setError('Failed to fetch schedules');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateNewSchedule = async () => {
        try {
            setGenerating(true);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/schedules/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ site_id: 1 })
            });

            if (response.ok) {
                await fetchSchedules(); // Refresh list
                setError(null);
            } else {
                const result = await response.json();
                setError(result.message || 'Failed to generate schedule');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const viewScheduleDetails = async (scheduleId) => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setSelectedSchedule(scheduleId);
                setScheduleDetails(result.data);
            } else {
                setError('Failed to fetch schedule details');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            published: 'success',
            archived: 'warning'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('he-IL');
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p className="mt-2">טוען נתונים...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="admin-dashboard">
            <Row>
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>ניהול לוחות זמנים</h1>
                        <Button
                            variant="primary"
                            onClick={generateNewSchedule}
                            disabled={generating}
                        >
                            {generating ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    מייצר...
                                </>
                            ) : (
                                'ייצור לוח זמנים חדש'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}
                </Col>
            </Row>

            <Row>
                <Col lg={selectedSchedule ? 6 : 12}>
                    <Card>
                        <Card.Header>
                            <h5>לוחות זמנים קיימים</h5>
                        </Card.Header>
                        <Card.Body>
                            {schedules.length === 0 ? (
                                <p className="text-muted">אין לוחות זמנים</p>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                    <tr>
                                        <th>תאריך תחילה</th>
                                        <th>תאריך סיום</th>
                                        <th>סטטוס</th>
                                        <th>פעולות</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {schedules.map(schedule => (
                                        <tr key={schedule.id}>
                                            <td>{formatDate(schedule.start_date)}</td>
                                            <td>{formatDate(schedule.end_date)}</td>
                                            <td>{getStatusBadge(schedule.status)}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => viewScheduleDetails(schedule.id)}
                                                >
                                                    צפייה
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {selectedSchedule && scheduleDetails && (
                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h5>פרטי לוח זמנים</h5>
                                <small className="text-muted">
                                    {formatDate(scheduleDetails.schedule.start_date)} - {formatDate(scheduleDetails.schedule.end_date)}
                                </small>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <strong>סטטוס:</strong> {getStatusBadge(scheduleDetails.schedule.status)}
                                    <br />
                                    <strong>סה"כ משמרות:</strong> {scheduleDetails.statistics.total_assignments}
                                    <br />
                                    <strong>עובדים בשימוש:</strong> {scheduleDetails.statistics.employees_used}
                                </div>

                                <h6>משמרות לפי יום:</h6>
                                {Object.entries(scheduleDetails.assignments_by_date).map(([date, assignments]) => (
                                    <div key={date} className="mb-3">
                                        <strong>{formatDate(date)}:</strong>
                                        <ul className="list-unstyled ms-3">
                                            {assignments.map(assignment => (
                                                <li key={assignment.id} className="small">
                                                    {assignment.employee.first_name} {assignment.employee.last_name} -
                                                    {assignment.shift.shift_name} ({assignment.position.pos_name})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>
        </Container>
    );
};

export default AdminDashboard;