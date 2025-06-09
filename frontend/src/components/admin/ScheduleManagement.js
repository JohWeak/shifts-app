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

    // Состояния для редактирования:
    const [editMode, setEditMode] = useState(false);
    const [editingPositions, setEditingPositions] = useState(new Set());
    const [pendingChanges, setPendingChanges] = useState({});
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [savingChanges, setSavingChanges] = useState(false);

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

    const publishSchedule = async () => {
        if (Object.keys(pendingChanges).length > 0) {
            setError({
                type: 'warning',
                message: 'Please save all pending changes before publishing'
            });
            return;
        }

        try {
            const response = await fetch(`/api/schedules/${selectedSchedule}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'published' })
            });

            if (response.ok) {
                await fetchSchedules();
                await viewScheduleDetails(selectedSchedule);
                setError({
                    type: 'success',
                    message: 'Schedule published successfully!'
                });
            }
        } catch (err) {
            setError({
                type: 'danger',
                message: 'Error publishing schedule'
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

    const toggleEditPosition = (positionId) => {
        const newEditingPositions = new Set(editingPositions);
        if (newEditingPositions.has(positionId)) {
            newEditingPositions.delete(positionId);
        } else {
            newEditingPositions.add(positionId);
        }
        setEditingPositions(newEditingPositions);
    };
    const handleCellClick = (date, shiftId, positionId) => {
        if (!editingPositions.has(positionId)) return;

        setSelectedCell({ date, shiftId, positionId });
        setShowEmployeeModal(true);
        fetchEmployeeRecommendations(date, shiftId, positionId);
    };

    const fetchEmployeeRecommendations = async (date, shiftId, positionId) => {
        setLoadingRecommendations(true);
        try {
            const params = new URLSearchParams({
                scheduleId: selectedSchedule,
                date,
                shiftId,
                positionId
            });

            const response = await fetch(`http://localhost:5000/api/schedules/recommendations/employees?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setRecommendations(result.data);
            } else {
                console.error('Failed to fetch recommendations');
                // Fallback - создаем структуру из all_employees
                const allEmployees = scheduleDetails?.all_employees || [];
                const formattedEmployees = allEmployees.map(emp => ({
                    emp_id: emp.emp_id,
                    name: `${emp.first_name} ${emp.last_name}`,
                    email: emp.email,
                    availability_status: 'available',
                    priority: 1
                }));

                setRecommendations({
                    recommendations: {
                        available: formattedEmployees,
                        preferred: [],
                        cannot_work: [],
                        violates_constraints: []
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            // Fallback - создаем структуру из all_employees
            const allEmployees = scheduleDetails?.all_employees || [];
            const formattedEmployees = allEmployees.map(emp => ({
                emp_id: emp.emp_id,
                name: `${emp.first_name} ${emp.last_name}`,
                email: emp.email,
                availability_status: 'available',
                priority: 1
            }));

            setRecommendations({
                recommendations: {
                    available: formattedEmployees,
                    preferred: [],
                    cannot_work: [],
                    violates_constraints: []
                }
            });
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleEmployeeAssign = (empId, empName) => {
        const { date, shiftId, positionId } = selectedCell;
        const changeKey = `${positionId}-${date}-${shiftId}-add-${empId}`;

        console.log('Adding employee:', { empId, empName, date, shiftId, positionId });

        setPendingChanges(prev => ({
            ...prev,
            [changeKey]: {
                action: 'assign',
                empId,
                empName,
                date,
                shiftId,
                positionId
            }
        }));

        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    const handleEmployeeRemove = (date, shiftId, positionId, assignmentId) => {
        console.log('Removing employee:', { date, shiftId, positionId, assignmentId });

        const changeKey = `${positionId}-${date}-${shiftId}-remove-${assignmentId}`;

        setPendingChanges(prev => ({
            ...prev,
            [changeKey]: {
                action: 'remove',
                assignmentId,
                date,
                shiftId,
                positionId
            }
        }));
    };

    const savePositionChanges = async (positionId) => {
        setSavingChanges(true);
        try {
            const positionChanges = Object.values(pendingChanges).filter(
                change => change.positionId === positionId
            );

            console.log('Saving changes for position:', positionId);
            console.log('All pending changes:', pendingChanges);
            console.log('Position changes:', positionChanges);
            console.log('Selected schedule:', selectedSchedule);

            if (positionChanges.length === 0) {
                setError({
                    type: 'info',
                    message: 'No changes to save'
                });
                toggleEditPosition(positionId);
                setSavingChanges(false);
                return;
            }

            const url = `http://localhost:5000/api/schedules/${selectedSchedule}/update-assignments`;
            console.log('Making request to:', url);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    changes: positionChanges
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (response.ok) {
                const result = await response.json();
                console.log('Save result:', result);

                // Обновляем локальные данные
                await viewScheduleDetails(selectedSchedule);

                // Удаляем изменения для этой позиции из pending
                const newPendingChanges = { ...pendingChanges };
                Object.keys(newPendingChanges).forEach(key => {
                    if (newPendingChanges[key].positionId === positionId) {
                        delete newPendingChanges[key];
                    }
                });
                setPendingChanges(newPendingChanges);

                toggleEditPosition(positionId);

                setError({
                    type: 'success',
                    message: `Position changes saved successfully! (${result.data.changesProcessed} changes)`
                });
            } else {
                const errorData = await response.json();
                console.error('Save error:', errorData);
                setError({
                    type: 'danger',
                    message: errorData.message || 'Failed to save changes'
                });
            }
        } catch (err) {
            console.error('Save error:', err);
            setError({
                type: 'danger',
                message: 'Error saving changes: ' + err.message
            });
        } finally {
            setSavingChanges(false);
        }
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
                                                            Object.entries(scheduleDetails.schedule_matrix).map(([positionId, positionData]) => {
                                                                const isEditing = editingPositions.has(positionId);
                                                                const hasPendingChanges = Object.values(pendingChanges).some(
                                                                    change => change.positionId === positionId
                                                                );

                                                                return (
                                                                    <div key={positionId} className="mb-4">
                                                                        {/* Header with Edit/Save button */}
                                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                                            <div>
                                                                                <h6 className="text-primary mb-0">
                                                                                    {positionData.position.name} - {positionData.position.profession}
                                                                                    {hasPendingChanges && (
                                                                                        <Badge bg="warning" className="ms-2">
                                                                                            Unsaved changes
                                                                                        </Badge>
                                                                                    )}
                                                                                </h6>
                                                                                <small className="text-muted">
                                                                                    Required: {positionData.position.num_of_emp} employees per shift
                                                                                </small>
                                                                            </div>
                                                                            <div className="d-flex gap-2">
                                                                                {!isEditing ? (
                                                                                    <Button
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                        onClick={() => toggleEditPosition(positionId)}
                                                                                        disabled={scheduleDetails.schedule.status === 'published'}
                                                                                    >
                                                                                        <i className="bi bi-pencil me-1"></i>
                                                                                        Edit
                                                                                    </Button>
                                                                                ) : (
                                                                                    <>
                                                                                        <Button
                                                                                            variant="success"
                                                                                            size="sm"
                                                                                            onClick={() => savePositionChanges(positionId)}
                                                                                            disabled={savingChanges}
                                                                                        >
                                                                                            <i className="bi bi-check-lg me-1"></i>
                                                                                            {savingChanges ? 'Saving...' : 'Save'}
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline-secondary"
                                                                                            size="sm"
                                                                                            onClick={() => toggleEditPosition(positionId)}
                                                                                        >
                                                                                            <i className="bi bi-x-lg me-1"></i>
                                                                                            Cancel
                                                                                        </Button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Table */}
                                                                        <div className="table-responsive">
                                                                            <table className="table table-bordered">
                                                                                <thead className="table-light">
                                                                                <tr>
                                                                                    <th style={{width: '120px'}}>Shift</th>
                                                                                    {Array.from({length: 7}, (_, dayIndex) => {
                                                                                        const date = new Date(scheduleDetails.schedule.start_date);
                                                                                        date.setDate(date.getDate() + dayIndex);
                                                                                        const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
                                                                                        const dayMonth = date.toLocaleDateString('en-US', {day: '2-digit', month: '2-digit'});
                                                                                        return (
                                                                                            <th key={dayIndex} className="text-center">
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
                                                                                        {Array.from({length: 7}, (_, dayIndex) => {
                                                                                            const date = new Date(scheduleDetails.schedule.start_date);
                                                                                            date.setDate(date.getDate() + dayIndex);
                                                                                            const dateStr = date.toISOString().split('T')[0];

                                                                                            const cellData = positionData.schedule?.[dateStr]?.[shift.shift_id];
                                                                                            const assignments = cellData?.assignments || [];

                                                                                            // Check for pending changes
                                                                                            const changeKey = `${positionId}-${dateStr}-${shift.shift_id}`;
                                                                                            const pendingAssignments = Object.values(pendingChanges).filter(change =>
                                                                                                change.action === 'assign' &&
                                                                                                change.positionId === positionId &&
                                                                                                change.date === dateStr &&
                                                                                                change.shiftId === shift.shift_id
                                                                                            );

                                                                                            const isEmpty = assignments.length === 0 && pendingAssignments.length === 0;
                                                                                            const isUnderstaffed = (assignments.length + pendingAssignments.length) < positionData.position.num_of_emp;

                                                                                            return (
                                                                                                <td
                                                                                                    key={dayIndex}
                                                                                                    className={`text-center ${isEditing ? 'position-relative' : ''} ${isEmpty && isEditing ? 'table-warning' : ''}`}
                                                                                                    style={{
                                                                                                        cursor: isEditing ? 'pointer' : 'default',
                                                                                                        minHeight: '60px',
                                                                                                        position: 'relative'
                                                                                                    }}
                                                                                                    onClick={() => isEditing && handleCellClick(dateStr, shift.shift_id, positionId)}
                                                                                                >
                                                                                                    {/* Existing assignments */}
                                                                                                    {assignments.map(assignment => {
                                                                                                        // Check if this assignment is marked for removal
                                                                                                        const isMarkedForRemoval = Object.values(pendingChanges).some(
                                                                                                            change => change.action === 'remove' && change.assignmentId === assignment.id
                                                                                                        );

                                                                                                        if (isMarkedForRemoval) {
                                                                                                            return (
                                                                                                                <div key={assignment.id} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-danger bg-opacity-25 rounded">
                                                                                                                    <small className="fw-bold text-danger text-decoration-line-through">
                                                                                                                        {assignment.employee.name}
                                                                                                                    </small>
                                                                                                                    <Badge bg="danger" size="sm">Removed</Badge>
                                                                                                                </div>
                                                                                                            );
                                                                                                        }

                                                                                                        return (
                                                                                                            <div key={assignment.id} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded">
                                                                                                                <small className="fw-bold">{assignment.employee.name}</small>
                                                                                                                {isEditing && (
                                                                                                                    <Button
                                                                                                                        variant="outline-danger"
                                                                                                                        size="sm"
                                                                                                                        onClick={(e) => {
                                                                                                                            e.stopPropagation();
                                                                                                                            handleEmployeeRemove(dateStr, shift.shift_id, positionId, assignment.id);
                                                                                                                        }}
                                                                                                                        style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                                                                                                    >
                                                                                                                        ×
                                                                                                                    </Button>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}

                                                                                                    {/* Pending assignments */}
                                                                                                    {pendingAssignments.map((change, index) => (
                                                                                                        <div key={`pending-${index}`} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-success bg-opacity-25 rounded">
                                                                                                            <small className="fw-bold text-success">{change.empName}</small>
                                                                                                            <div>
                                                                                                                <Badge bg="success" size="sm" className="me-1">New</Badge>
                                                                                                                {isEditing && (
                                                                                                                    <Button
                                                                                                                        variant="outline-danger"
                                                                                                                        size="sm"
                                                                                                                        onClick={(e) => {
                                                                                                                            e.stopPropagation();
                                                                                                                            // Remove pending change
                                                                                                                            const changeKey = `${positionId}-${dateStr}-${shift.shift_id}-add-${change.empId}`;
                                                                                                                            setPendingChanges(prev => {
                                                                                                                                const newChanges = { ...prev };
                                                                                                                                delete newChanges[changeKey];
                                                                                                                                return newChanges;
                                                                                                                            });
                                                                                                                        }}
                                                                                                                        style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                                                                                                    >
                                                                                                                        ×
                                                                                                                    </Button>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}

                                                                                                    {/* Add employee button */}
                                                                                                    {isEditing && isEmpty && (
                                                                                                        <div className="text-muted">
                                                                                                            <i className="bi bi-plus-circle"></i> Add Employee
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {isEditing && isUnderstaffed && !isEmpty && (
                                                                                                        <div className="text-warning">
                                                                                                            <small>Need {positionData.position.num_of_emp - assignments.length - (pendingChange ? 1 : 0)} more</small>
                                                                                                        </div>
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
                                                                );
                                                            }) : (
                                                                <div className="text-center text-muted p-4">
                                                                    No schedule data available
                                                                </div>
                                                            )
                                                        }
                                                        {/* Publish Button */}
                                                        {scheduleDetails.schedule.status === 'draft' && (
                                                            <div className="text-center mt-4">
                                                                <Button
                                                                    variant="success"
                                                                    onClick={publishSchedule}
                                                                    disabled={Object.keys(pendingChanges).length > 0}
                                                                >
                                                                    <i className="bi bi-check-circle me-2"></i>
                                                                    Publish Schedule
                                                                </Button>
                                                                {Object.keys(pendingChanges).length > 0 && (
                                                                    <div className="text-warning mt-2">
                                                                        <small>Save all changes before publishing</small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
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
                                        <Form.Label className="fw-semibold" >
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
            {/* Employee Selection Modal - ДОБАВЬ ЗДЕСЬ */}
            <Modal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Select Employee for Shift</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCell && (
                        <div className="mb-3">
                            <strong>Date:</strong> {new Date(selectedCell.date).toLocaleDateString('en-US')} <br />
                            <strong>Shift:</strong> {scheduleDetails.all_shifts.find(s => s.shift_id == selectedCell.shiftId)?.shift_name}
                        </div>
                    )}

                    {loadingRecommendations ? (
                        <div className="text-center">Loading recommendations...</div>
                    ) : recommendations ? (
                        <div>
                            {/* Available Employees */}
                            {recommendations.recommendations?.available?.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="text-primary">Available Employees</h6>
                                    {recommendations.recommendations.available.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <br />
                                                <small className="text-muted">ID: {emp.emp_id}</small>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => handleEmployeeAssign(emp.emp_id, emp.name)}
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Show all employees if no recommendations */}
                            {(!recommendations.recommendations?.available || recommendations.recommendations.available.length === 0) && scheduleDetails.all_employees && (
                                <div className="mb-4">
                                    <h6 className="text-secondary">All Employees</h6>
                                    {scheduleDetails.all_employees.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                                            <div>
                                                <strong>{emp.first_name} {emp.last_name}</strong>
                                                <br />
                                                <small className="text-muted">ID: {emp.emp_id}</small>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => handleEmployeeAssign(emp.emp_id, `${emp.first_name} ${emp.last_name}`)}
                                            >
                                                Select
                                            </Button>
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
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

        </AdminLayout>

    );
};

export default ScheduleManagement;