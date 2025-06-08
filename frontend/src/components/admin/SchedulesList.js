// frontend/src/components/admin/SchedulesList.js - НОВЫЙ ФАЙЛ
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const SchedulesList = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/schedules', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setSchedules(result.data);
                }
            } else {
                setError('Failed to fetch schedules');
            }
        } catch (err) {
            setError('Error loading schedules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('he-IL');
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            published: 'success',
            archived: 'warning'
        };
        const labels = {
            draft: 'טיוטה',
            published: 'פורסם',
            archived: 'בארכיון'
        };
        return <Badge bg={variants[status] || 'secondary'}>{labels[status]}</Badge>;
    };

    if (loading) return <div className="text-center p-4">Loading schedules...</div>;

    return (
        <AdminLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>ניהול לוחות זמנים</h2>
                    <Button variant="primary" onClick={() => navigate('/admin')}>
                        חזרה לדשבורד
                    </Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Card>
                    <Card.Header>
                        <h5>רשימת לוחות זמנים</h5>
                    </Card.Header>
                    <Card.Body>
                        {schedules.length === 0 ? (
                            <div className="text-center text-muted">
                                אין לוחות זמנים זמינים
                            </div>
                        ) : (
                            <Table responsive striped hover>
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>תאריך התחלה</th>
                                    <th>תאריך סיום</th>
                                    <th>סטטוס</th>
                                    <th>אתר עבודה</th>
                                    <th>תאריך יצירה</th>
                                    <th>פעולות</th>
                                </tr>
                                </thead>
                                <tbody>
                                {schedules.map(schedule => (
                                    <tr key={schedule.id}>
                                        <td>{schedule.id}</td>
                                        <td>{formatDate(schedule.start_date)}</td>
                                        <td>{formatDate(schedule.end_date)}</td>
                                        <td>{getStatusBadge(schedule.status)}</td>
                                        <td>{schedule.workSite?.site_name || 'N/A'}</td>
                                        <td>{formatDate(schedule.createdAt)}</td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => navigate(`/admin/schedule/${schedule.id}/edit`)}
                                                className="me-2"
                                            >
                                                עריכה
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => {/* TODO: Export functionality */}}
                                            >
                                                יצוא
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </AdminLayout>
    );
};

export default SchedulesList;