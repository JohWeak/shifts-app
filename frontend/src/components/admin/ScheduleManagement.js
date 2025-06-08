// frontend/src/components/admin/ScheduleManagement.js
import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Table,
    Badge,
    Alert,
    Spinner,
    Modal,
    Form,
    Row,
    Col,
    Tabs,
    Tab,
    ProgressBar,
    Container,
    Dropdown,        // Для меню действий
    ButtonGroup,     // Может понадобиться
    OverlayTrigger,  // Для tooltips
    Tooltip          // Для tooltips
} from 'react-bootstrap';
import AdminLayout from './AdminLayout';

const ScheduleManagement = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleDetails, setScheduleDetails] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Generation settings
    const [generateSettings, setGenerateSettings] = useState({
        siteId: 1,
        algorithm: 'auto', // 'auto', 'cp-sat', 'simple'
        weekStart: '',
        generatePeriod: 'next-week' // 'next-week', 'custom', 'multiple'
    });

    useEffect(() => {
        fetchSchedules();
        // Set default week start to next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekString = nextWeek.toISOString().split('T')[0];
        setGenerateSettings(prev => ({...prev, weekStart: nextWeekString}));
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
                setError({
                    type: 'danger',
                    message: 'Failed to fetch schedules'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
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
                body: JSON.stringify({
                    site_id: generateSettings.siteId,
                    algorithm: generateSettings.algorithm,
                    week_start: generateSettings.weekStart
                })
            });

            if (response.ok) {
                const result = await response.json();
                await fetchSchedules();
                setShowGenerateModal(false);
                setError({
                    type: 'success',
                    message: `Schedule generated successfully using ${result.algorithm || 'auto'}! ${result.solveTime ? `Time: ${result.solveTime}ms` : ''}`
                });
            } else {
                const result = await response.json();
                setError({
                    type: 'danger',
                    message: result.message || 'Failed to generate schedule'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
        } finally {
            setGenerating(false);
        }
    };

    const compareAlgorithms = async () => {
        try {
            setGenerating(true);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/schedules/compare-algorithms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_id: generateSettings.siteId
                })
            });

            if (response.ok) {
                const result = await response.json();
                setError({
                    type: 'info',
                    message: (
                        <div>
                            <div className="fw-semibold mb-2">Algorithm Comparison Results:</div>
                            <div className="small">
                                <div>• CP-SAT: <Badge
                                    bg={result.comparison.cp_sat.status === 'success' ? 'success' : 'danger'}>{result.comparison.cp_sat.status}</Badge>
                                </div>
                                <div>• Simple: <Badge
                                    bg={result.comparison.simple.status === 'success' ? 'success' : 'danger'}>{result.comparison.simple.status}</Badge>
                                </div>
                                <div className="mt-2">
                                    <strong>Recommended: </strong>
                                    <Badge bg="primary">{result.comparison.recommended}</Badge>
                                </div>
                            </div>
                        </div>
                    )
                });
                await fetchSchedules();
            } else {
                const result = await response.json();
                setError({
                    type: 'danger',
                    message: result.message || 'Failed to compare algorithms'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
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
                setActiveTab('details');
            } else {
                setError({
                    type: 'danger',
                    message: 'Failed to fetch schedule details'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
        }
    };

    const publishSchedule = async (scheduleId) => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({status: 'published'})
            });

            if (response.ok) {
                setError({
                    type: 'success',
                    message: 'Schedule published successfully!'
                });
                await fetchSchedules();
                if (scheduleDetails && selectedSchedule === scheduleId) {
                    await viewScheduleDetails(scheduleId);
                }
            } else {
                const result = await response.json();
                setError({
                    type: 'danger',
                    message: result.message || 'Failed to publish schedule'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            published: 'success',
            archived: 'warning'
        };
        const icons = {
            draft: 'file-earmark',
            published: 'check-circle',
            archived: 'archive'
        };
        return (
            <Badge bg={variants[status] || 'secondary'} className="d-flex align-items-center">
                <i className={`bi bi-${icons[status]} me-1`}></i>
                {status}
            </Badge>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Экспорт расписания
    const exportSchedule = async (scheduleId, format = 'json') => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}/export?format=${format}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                if (format === 'csv') {
                    // Скачать CSV файл
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `schedule-${scheduleId}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    setError({
                        type: 'success',
                        message: 'Schedule exported successfully!'
                    });
                } else {
                    // JSON экспорт
                    const data = await response.json();
                    const blob = new Blob([JSON.stringify(data.data, null, 2)], {type: 'application/json'});
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `schedule-${scheduleId}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    setError({
                        type: 'success',
                        message: 'Schedule exported successfully!'
                    });
                }
            } else {
                const result = await response.json();
                setError({
                    type: 'danger',
                    message: result.message || 'Failed to export schedule'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
        }
    };

// Дублирование расписания
    const duplicateSchedule = async (scheduleId) => {
        try {
            // Запросить новую дату
            const newWeekStart = prompt('Enter new week start date (YYYY-MM-DD):');
            if (!newWeekStart) return;

            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newWeekStart: newWeekStart
                })
            });

            if (response.ok) {
                const result = await response.json();
                setError({
                    type: 'success',
                    message: `Schedule duplicated successfully! New schedule ID: ${result.data.new_schedule_id}`
                });
                await fetchSchedules(); // Обновить список
            } else {
                const result = await response.json();
                setError({
                    type: 'danger',
                    message: result.message || 'Failed to duplicate schedule'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
        }
    };

// Удаление расписания
    const deleteSchedule = async (scheduleId) => {
        if (!window.confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setError({
                    type: 'success',
                    message: 'Schedule deleted successfully!'
                });
                await fetchSchedules(); // Обновить список

                // Если удаленное расписание было открыто в деталях, закрыть его
                if (selectedSchedule === scheduleId) {
                    setSelectedSchedule(null);
                    setScheduleDetails(null);
                    setActiveTab('overview');
                }
            } else {
                const result = await response.json();
                setError({
                    type: 'danger',
                    message: result.message || 'Failed to delete schedule'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Network error: ' + err.message
            });
        }
    };

    const getAlgorithmBadge = (algorithm) => {
        const colors = {
            'CP-SAT': 'primary',
            'CP-SAT-Python': 'primary',
            'Simple': 'info',
            'Advanced-Heuristic': 'warning',
            'auto': 'secondary'
        };
        return (
            <Badge bg={colors[algorithm] || 'secondary'} className="small">
                {algorithm || 'Unknown'}
            </Badge>
        );
    };

    const handleEditPosition = (scheduleId, positionId) => {
        // Переход на страницу редактирования с параметром позиции
        navigate(`/admin/schedule/${scheduleId}/edit?position=${positionId}`);
    };

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                {/* Page Header */}
                <div
                    className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    <div className="mb-3 mb-md-0">
                        <h1 className="h3 mb-2 text-dark fw-bold">
                            <i className="bi bi-calendar-week me-2 text-primary"></i>
                            Schedule Management
                        </h1>
                        <p className="text-muted mb-0">Create and manage employee schedules with advanced algorithms</p>
                    </div>
                    <div className="d-flex flex-column flex-sm-row gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={compareAlgorithms}
                            disabled={generating}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <i className="bi bi-speedometer2 me-2"></i>
                            Compare Algorithms
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setShowGenerateModal(true)}
                            disabled={generating}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Generate Schedule
                        </Button>
                    </div>
                </div>

                {/* Alert Messages */}
                {error && (
                    <Alert
                        variant={error.type || 'danger'}
                        className="mb-4 d-flex align-items-start"
                        dismissible
                        onClose={() => setError(null)}
                    >
                        <i className={`bi bi-${error.type === 'success' ? 'check-circle' : error.type === 'info' ? 'info-circle' : 'exclamation-triangle'} me-2 mt-1`}></i>
                        <div>
                            {typeof error.message === 'string' ? error.message : error.message}
                        </div>
                    </Alert>
                )}

                {/* Main Content */}
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <Tabs
                            activeKey={activeTab}
                            onSelect={setActiveTab}
                            className="border-bottom px-4"
                            variant="underline"
                        >
                            <Tab
                                eventKey="overview"
                                title={
                                    <span className="d-flex align-items-center">
                                        <i className="bi bi-list-ul me-2"></i>
                                        Overview
                                        {schedules.length > 0 && (
                                            <Badge bg="primary" className="ms-2">{schedules.length}</Badge>
                                        )}
                                    </span>
                                }
                            >
                                <div className="p-4">
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="primary" className="mb-3"/>
                                            <p className="text-muted">Loading schedules...</p>
                                        </div>
                                    ) : schedules.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="bi bi-calendar-x display-1 text-muted mb-3"></i>
                                            <h4 className="text-muted">No schedules found</h4>
                                            <p className="text-muted mb-4">Generate your first schedule to get
                                                started</p>
                                            <Button
                                                variant="primary"
                                                onClick={() => setShowGenerateModal(true)}
                                                className="d-flex align-items-center mx-auto"
                                            >
                                                <i className="bi bi-plus-circle me-2"></i>
                                                Generate First Schedule
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table hover className="align-middle">
                                                <thead className="table-light">
                                                <tr>
                                                    <th className="border-0 fw-semibold">Schedule</th>
                                                    <th className="border-0 fw-semibold">Week Period</th>
                                                    <th className="border-0 fw-semibold">Status</th>
                                                    <th className="border-0 fw-semibold">Algorithm</th>
                                                    <th className="border-0 fw-semibold">Created</th>
                                                    <th className="border-0 fw-semibold">Site</th>
                                                    <th className="border-0 fw-semibold text-center">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {schedules.map(schedule => (
                                                    <tr key={schedule.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                                                    <i className="bi bi-calendar-week text-primary"></i>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-semibold">Schedule
                                                                        #{schedule.id}</div>
                                                                    <small className="text-muted">
                                                                        {schedule.assignments_count || 'N/A'} assignments
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <div
                                                                    className="fw-medium">{formatDate(schedule.start_date)}</div>
                                                                <small
                                                                    className="text-muted">to {formatDate(schedule.end_date)}</small>
                                                            </div>
                                                        </td>
                                                        <td>{getStatusBadge(schedule.status)}</td>
                                                        <td>
                                                            {schedule.text_file ? (
                                                                (() => {
                                                                    try {
                                                                        const metadata = JSON.parse(schedule.text_file);
                                                                        return getAlgorithmBadge(metadata.algorithm);
                                                                    } catch {
                                                                        return getAlgorithmBadge('Unknown');
                                                                    }
                                                                })()
                                                            ) : (
                                                                getAlgorithmBadge('Unknown')
                                                            )}
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {formatDate(schedule.createdAt)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <Badge bg="light" text="dark">
                                                                {schedule.workSite?.site_name || 'Main Site'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-1 justify-content-center">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    onClick={() => viewScheduleDetails(schedule.id)}
                                                                    className="d-flex align-items-center"
                                                                    title="View Details"
                                                                >
                                                                    <i className="bi bi-eye"></i>
                                                                </Button>


                                                                {schedule.status === 'draft' && (
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        onClick={() => publishSchedule(schedule.id)}
                                                                        className="d-flex align-items-center"
                                                                        title="Publish Schedule"
                                                                    >
                                                                        <i className="bi bi-check-circle"></i>
                                                                    </Button>
                                                                )}

                                                                <Dropdown align="end">
                                                                    <Dropdown.Toggle
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        className="no-caret d-flex align-items-center"
                                                                    >
                                                                        <i className="bi bi-three-dots"></i>
                                                                    </Dropdown.Toggle>

                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item
                                                                            onClick={() => exportSchedule(schedule.id, 'json')}>
                                                                            <i className="bi bi-download me-2"></i>
                                                                            Export JSON
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            onClick={() => exportSchedule(schedule.id, 'csv')}>
                                                                            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                                                                            Export CSV
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider/>
                                                                        <Dropdown.Item
                                                                            onClick={() => duplicateSchedule(schedule.id)}>
                                                                            <i className="bi bi-files me-2"></i>
                                                                            Duplicate
                                                                        </Dropdown.Item>
                                                                        {schedule.status === 'draft' && (
                                                                            <>
                                                                                <Dropdown.Divider/>
                                                                                <Dropdown.Item
                                                                                    onClick={() => deleteSchedule(schedule.id)}
                                                                                    className="text-danger"
                                                                                >
                                                                                    <i className="bi bi-trash me-2"></i>
                                                                                    Delete
                                                                                </Dropdown.Item>
                                                                            </>
                                                                        )}
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </Tab>

                            <Tab
                                eventKey="details"
                                title={
                                    <span className="d-flex align-items-center">
                                        <i className="bi bi-calendar-week me-2"></i>
                                        Schedule Details
                                    </span>
                                }
                                disabled={!selectedSchedule}
                            >
                                {scheduleDetails && (
                                    <div className="p-4">
                                        {/* Schedule Information сверху */}
                                        <Row className="mb-4">
                                            <Col xs={12}>
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
                                                                <div>{getStatusBadge(scheduleDetails.schedule.status)}</div>
                                                            </Col>
                                                            <Col md={2} className="mb-3">
                                                                <div className="small text-muted mb-1">Total Assignments</div>
                                                                <div className="h4 mb-0 text-primary">{scheduleDetails.statistics.total_assignments}</div>
                                                            </Col>
                                                            <Col md={2} className="mb-3">
                                                                <div className="small text-muted mb-1">Employees Used</div>
                                                                <div className="h5 mb-0">{scheduleDetails.statistics.employees_used}</div>
                                                            </Col>
                                                            <Col md={3} className="mb-3">
                                                                <div className="small text-muted mb-1">Algorithm</div>
                                                                <div>{getAlgorithmBadge(scheduleDetails.schedule.metadata?.algorithm)}</div>
                                                            </Col>
                                                            <Col md={3} className="mb-3">
                                                                <div className="small text-muted mb-1">Week Period</div>
                                                                <div className="small">
                                                                    {formatDate(scheduleDetails.schedule.start_date)} - {formatDate(scheduleDetails.schedule.end_date)}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {/* Schedule Tables by Position внизу */}
                                        <Row>
                                            <Col xs={12}>
                                                <Card className="border-0">
                                                    <Card.Header className="bg-light border-0">
                                                        <h5 className="mb-0 d-flex align-items-center">
                                                            <i className="bi bi-calendar-week me-2 text-primary"></i>
                                                            Weekly Schedule by Position
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {/* Здесь будут таблицы по позициям */}
                                                        {scheduleDetails.schedule_matrix ?
                                                            Object.entries(scheduleDetails.schedule_matrix).map(([positionId, positionData]) => (
                                                                <div key={positionId} className="mb-4">
                                                                    {/* Заголовок с кнопкой Edit */}
                                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                                        <h6 className="text-primary mb-0">
                                                                            {positionData.position.name} - {positionData.position.profession}
                                                                            <small className="text-muted ms-2">
                                                                                (Requires {positionData.position.num_of_emp} employees per shift)
                                                                            </small>
                                                                        </h6>
                                                                        <Button
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            onClick={() => handleEditPosition(scheduleDetails.schedule.id, positionId)}
                                                                            className="d-flex align-items-center"
                                                                        >
                                                                            <i className="bi bi-pencil me-1"></i>
                                                                            Edit Position
                                                                        </Button>
                                                                    </div>

                                                                    {/* Таблица для этой позиции */}
                                                                    <div className="table-responsive">
                                                                        <table className="table table-bordered">
                                                                            <thead className="table-light">
                                                                            <tr>
                                                                                <th style={{width: '120px'}}>Shift</th>
                                                                                {/* Динамические заголовки дней */}
                                                                                {Array.from({length: 7}, (_, dayIndex) => {
                                                                                    const date = new Date(scheduleDetails.schedule.start_date);
                                                                                    date.setDate(date.getDate() + dayIndex);
                                                                                    const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
                                                                                    const dayMonth = date.toLocaleDateString('en-US', {day: '2-digit', month: '2-digit'});
                                                                                    return (
                                                                                        <th key={dayIndex}>
                                                                                            {dayName} {dayMonth}
                                                                                        </th>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                            {scheduleDetails.all_shifts?.map(shift => (
                                                                                <tr key={shift.shift_id}>
                                                                                    <td className={`shift-${shift.shift_type} text-center fw-bold`}>
                                                                                        {shift.shift_name}<br/>
                                                                                        <small>{shift.start_time} ({shift.duration}h)</small>
                                                                                    </td>
                                                                                    {/* 7 дней недели */}
                                                                                    {Array.from({length: 7}, (_, dayIndex) => {
                                                                                        const date = new Date(scheduleDetails.schedule.start_date);
                                                                                        date.setDate(date.getDate() + dayIndex);
                                                                                        const dateStr = date.toISOString().split('T')[0];

                                                                                        const cellData = positionData.schedule?.[dateStr]?.[shift.shift_id];
                                                                                        const assignments = cellData?.assignments || [];

                                                                                        return (
                                                                                            <td key={dayIndex} className="text-center">
                                                                                                {assignments.map(assignment => (
                                                                                                    <div key={assignment.id} className="small fw-bold text-primary">
                                                                                                        {assignment.employee.name}
                                                                                                    </div>
                                                                                                ))}
                                                                                                {assignments.length === 0 && (
                                                                                                    <span className="text-muted">-</span>
                                                                                                )}
                                                                                            </td>
                                                                                        );
                                                                                    })}
                                                                                </tr>
                                                                            ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="text-center text-muted p-4">
                                                                    No schedule matrix data available.
                                                                    <br />
                                                                    <small>Make sure the backend returns schedule_matrix in the response.</small>
                                                                </div>
                                                            )
                                                        }
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </Tab>
                        </Tabs>
                    </Card.Body>
                </Card>

                {/* Generate Schedule Modal */}
                <Modal
                    show={showGenerateModal}
                    onHide={() => setShowGenerateModal(false)}
                    size="lg"
                    centered
                >
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="d-flex align-items-center">
                            <i className="bi bi-plus-circle me-2 text-primary"></i>
                            Generate New Schedule
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="pt-0">
                        <p className="text-muted mb-4">Configure the parameters for generating a new employee
                            schedule.</p>
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-cpu me-2"></i>
                                            Algorithm
                                        </Form.Label>
                                        <Form.Select
                                            value={generateSettings.algorithm}
                                            onChange={(e) => setGenerateSettings({
                                                ...generateSettings,
                                                algorithm: e.target.value
                                            })}
                                        >
                                            <option value="auto">🤖 Auto (Best Available)</option>
                                            <option value="cp-sat">🧠 CP-SAT (Advanced AI)</option>
                                            <option value="simple">⚡ Simple Scheduler</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            Auto mode will automatically choose the best algorithm based on constraints.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-calendar me-2"></i>
                                            Week Start Date
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={generateSettings.weekStart}
                                            onChange={(e) => setGenerateSettings({
                                                ...generateSettings,
                                                weekStart: e.target.value
                                            })}
                                        />
                                        <Form.Text className="text-muted">
                                            Select the Sunday that starts the week to schedule.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-building me-2"></i>
                                            Site ID
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={generateSettings.siteId}
                                            onChange={(e) => setGenerateSettings({
                                                ...generateSettings,
                                                siteId: parseInt(e.target.value)
                                            })}
                                            min="1"
                                        />
                                        <Form.Text className="text-muted">
                                            The workplace site to generate schedule for.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="outline-secondary" onClick={() => setShowGenerateModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={generateNewSchedule}
                            disabled={generating}
                            className="d-flex align-items-center"
                        >
                            {generating ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2"/>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-gear me-2"></i>
                                    Generate Schedule
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </AdminLayout>
    );
};

export default ScheduleManagement;