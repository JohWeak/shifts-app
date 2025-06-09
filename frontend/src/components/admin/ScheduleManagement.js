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
    Dropdown,
    ButtonGroup,
    OverlayTrigger,
    Tooltip
} from 'react-bootstrap';
import AdminLayout from './AdminLayout';
import { MESSAGES, interpolateMessage } from '../../i18n/messages';
import './ScheduleManagement.css';

const ScheduleManagement = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleDetails, setScheduleDetails] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Edit mode states
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
        site_id: 1, // Изменили с siteId на site_id для соответствия API
        algorithm: 'auto',
        weekStart: '',
        generatePeriod: 'next-week'
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
                console.log('Schedules data:', result.data); // Debug log
                setSchedules(result.data);
            } else {
                throw new Error('Failed to fetch schedules');
            }
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError({
                type: 'danger',
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const viewScheduleDetails = async (scheduleId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Schedule details received:', result.data);
                setScheduleDetails(result.data);
                setSelectedSchedule(scheduleId);
                setActiveTab('view');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch schedule details');
            }
        } catch (err) {
            console.error('Error fetching schedule details:', err);
            setError({
                type: 'danger',
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    // НОВАЯ ФУНКЦИЯ: Генерация расписания
    const generateSchedule = async () => {
        try {
            setGenerating(true);
            setError(null);
            const token = localStorage.getItem('token');

            console.log('Generating schedule with settings:', generateSettings);

            const response = await fetch('http://localhost:5000/api/schedules/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_id: generateSettings.site_id,
                    algorithm: generateSettings.algorithm,
                    week_start: generateSettings.weekStart
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Generation result:', result);

                setError({
                    type: 'success',
                    message: `Schedule generated successfully! ${result.data?.assignments || 0} assignments created.`
                });

                // Refresh the schedules list
                await fetchSchedules();

                // Close modal
                setShowGenerateModal(false);

                // If we have a schedule ID, view its details
                if (result.data?.schedule?.id) {
                    await viewScheduleDetails(result.data.schedule.id);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate schedule');
            }
        } catch (err) {
            console.error('Error generating schedule:', err);
            setError({
                type: 'danger',
                message: `Error generating schedule: ${err.message}`
            });
        } finally {
            setGenerating(false);
        }
    };

    //  Сравнение алгоритмов
    const compareAlgorithms = async () => {
        try {
            setComparing(true);
            setError(null);
            const token = localStorage.getItem('token');

            console.log('Comparing algorithms...');

            const response = await fetch('http://localhost:5000/api/schedules/compare-algorithms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_id: generateSettings.site_id,
                    week_start: generateSettings.weekStart
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Comparison result:', result);
                console.log('Comparison structure:', {
                    hasComparison: !!result.comparison,
                    hasRecommended: !!result.comparison?.recommended,
                    algorithms: Object.keys(result.comparison || {})
                });

                // ИСПРАВЛЕНИЕ: использовать правильную структуру ответа
                setComparisonResults({
                    comparison: result.comparison,
                    best_algorithm: result.comparison.recommended, // Использовать recommended вместо best_algorithm
                    recommendation: result.message
                });
                setShowComparisonModal(true);

                setError({
                    type: 'success',
                    message: `Algorithm comparison completed! Best algorithm: ${result.comparison.recommended}`
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to compare algorithms');
            }
        } catch (err) {
            console.error('Error comparing algorithms:', err);
            setError({
                type: 'danger',
                message: `Error comparing algorithms: ${err.message}`
            });
        } finally {
            setComparing(false);
        }
    };

    const toggleEditPosition = (positionId) => {
        setEditingPositions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(positionId)) {
                newSet.delete(positionId);
            } else {
                newSet.add(positionId);
            }
            return newSet;
        });
    };

    const handleCellClick = async (positionId, date, shiftId) => {
        if (!editingPositions.has(positionId)) return;

        setSelectedCell({ positionId, date, shiftId });
        setLoadingRecommendations(true);
        setShowEmployeeModal(true);

        try {
            const allEmployees = scheduleDetails?.all_employees || [];

            const formattedEmployees = allEmployees.map(emp => ({
                emp_id: emp.emp_id,
                first_name: emp.first_name,
                last_name: emp.last_name,
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
        } catch (err) {
            console.error('Error getting recommendations:', err);
            setRecommendations({
                recommendations: {
                    available: [],
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
                    message: MESSAGES.NO_CHANGES_TO_SAVE
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

            if (response.ok) {
                const result = await response.json();
                console.log('Save result:', result);

                // Update local data by re-fetching schedule details
                await viewScheduleDetails(selectedSchedule);

                // Remove changes for this position from pending
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
                    message: interpolateMessage(MESSAGES.POSITION_CHANGES_SAVED, {
                        count: result.data?.changesProcessed || positionChanges.length
                    })
                });
            } else {
                const errorData = await response.json();
                console.error('Save error:', errorData);
                setError({
                    type: 'danger',
                    message: errorData.message || MESSAGES.FAILED_TO_SAVE
                });
            }
        } catch (err) {
            console.error('Save error:', err);
            setError({
                type: 'danger',
                message: interpolateMessage(MESSAGES.ERROR_SAVING_CHANGES, {
                    error: err.message
                })
            });
        } finally {
            setSavingChanges(false);
        }
    };

    const renderPositionSchedule = (positionId, positionData) => {
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
                                    {MESSAGES.UNSAVED_CHANGES}
                                </Badge>
                            )}
                        </h6>
                        <small className="text-muted">
                            {interpolateMessage(MESSAGES.REQUIRED_EMPLOYEES, {
                                count: positionData.position.num_of_emp
                            })}
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        {!isEditing ? (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => toggleEditPosition(positionId)}
                                disabled={savingChanges}
                            >
                                <i className="bi bi-pencil me-1"></i>
                                {MESSAGES.EDIT}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => savePositionChanges(positionId)}
                                    disabled={savingChanges || !hasPendingChanges}
                                >
                                    {savingChanges ? (
                                        <>
                                            <Spinner size="sm" className="me-1" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check me-1"></i>
                                            {MESSAGES.SAVE}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => toggleEditPosition(positionId)}
                                    disabled={savingChanges}
                                >
                                    {MESSAGES.CANCEL}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Schedule Table */}
                <Table responsive bordered size="sm" className="schedule-table">
                    <thead>
                    <tr>
                        <th className="shift-header">Shift</th>
                        <th>{MESSAGES.SUNDAY}</th>
                        <th>{MESSAGES.MONDAY}</th>
                        <th>{MESSAGES.TUESDAY}</th>
                        <th>{MESSAGES.WEDNESDAY}</th>
                        <th>{MESSAGES.THURSDAY}</th>
                        <th>{MESSAGES.FRIDAY}</th>
                        <th>{MESSAGES.SATURDAY}</th>
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
                                const pendingAssignments = Object.values(pendingChanges).filter(change =>
                                    change.action === 'assign' &&
                                    change.positionId === positionId &&
                                    change.date === dateStr &&
                                    change.shiftId === shift.shift_id
                                );

                                // Calculate how many pending removals
                                const pendingRemovals = Object.values(pendingChanges).filter(change =>
                                    change.action === 'remove' &&
                                    change.positionId === positionId &&
                                    change.date === dateStr &&
                                    change.shiftId === shift.shift_id
                                );

                                const currentAssignments = assignments.length - pendingRemovals.length;
                                const totalAssignments = currentAssignments + pendingAssignments.length;
                                const isEmpty = totalAssignments === 0;
                                const isUnderstaffed = totalAssignments < positionData.position.num_of_emp;

                                return (
                                    <td
                                        key={dayIndex}
                                        className={`text-center ${isEditing ? 'position-relative' : ''} ${isEmpty && isEditing ? 'table-warning' : ''}`}
                                        style={{
                                            cursor: isEditing ? 'pointer' : 'default',
                                            minHeight: '60px',
                                            verticalAlign: 'middle'
                                        }}
                                        onClick={() => handleCellClick(positionId, dateStr, shift.shift_id)}
                                    >
                                        <div>
                                            {/* Current assignments */}
                                            {assignments.map(assignment => {
                                                const isBeingRemoved = pendingRemovals.some(
                                                    change => change.assignmentId === assignment.id
                                                );

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className={`mb-1 ${isBeingRemoved ? 'text-decoration-line-through text-muted' : ''}`}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center">
                                                                <span style={{ fontSize: '0.8rem' }}>
                                                                    {assignment.employee.name}
                                                                </span>
                                                            {isEditing && !isBeingRemoved && (
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEmployeeRemove(
                                                                            dateStr,
                                                                            shift.shift_id,
                                                                            positionId,
                                                                            assignment.id
                                                                        );
                                                                    }}
                                                                    style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                                                >
                                                                    ×
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Pending new assignments */}
                                            {pendingAssignments.map((change, index) => (
                                                <div key={`pending-${index}`} className="mb-1">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                            <span style={{ fontSize: '0.8rem' }} className="text-success">
                                                                {change.empName}
                                                            </span>
                                                        <Badge bg="success" size="sm" className="me-1">
                                                            {MESSAGES.NEW}
                                                        </Badge>
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
                                                    <i className="bi bi-plus-circle"></i> {MESSAGES.ADD_EMPLOYEE}
                                                </div>
                                            )}

                                            {/* Warning about understaffing */}
                                            {isEditing && isUnderstaffed && !isEmpty && (
                                                <div className="text-warning">
                                                    <small>
                                                        {interpolateMessage(MESSAGES.NEED_MORE_EMPLOYEES, {
                                                            count: positionData.position.num_of_emp - totalAssignments
                                                        })}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                {/* Page Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    <div className="mb-3 mb-md-0">
                        <h1 className="h3 mb-2 text-dark fw-bold">
                            <i className="bi bi-calendar-week me-2 text-primary"></i>
                            {MESSAGES.SCHEDULE_MANAGEMENT}
                        </h1>
                        <p className="text-muted mb-0">{MESSAGES.CREATE_MANAGE_SCHEDULES}</p>
                    </div>
                    <div className="d-flex flex-column flex-sm-row gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={compareAlgorithms}
                            disabled={generating || comparing}
                            className="d-flex align-items-center justify-content-center"
                        >
                            {comparing ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Comparing...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-speedometer2 me-2"></i>
                                    {MESSAGES.COMPARE_ALGORITHMS}
                                </>
                            )}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setShowGenerateModal(true)}
                            disabled={generating}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            {MESSAGES.GENERATE_SCHEDULE}
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
                        <i className={`bi bi-${error.type === 'success' ? 'check-circle' : error.type === 'info' ? 'info-circle' : 'exclamation-triangle'} me-2`}></i>
                        <div>{error.message}</div>
                    </Alert>
                )}

                {/* Content Tabs */}
                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4"
                >
                    <Tab eventKey="overview" title="Schedule Overview">
                        <Card>
                            <Card.Body>
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" />
                                        <div className="mt-2">Loading schedules...</div>
                                    </div>
                                ) : schedules.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="bi bi-calendar-x display-1 text-muted"></i>
                                        <h4>No schedules found</h4>
                                        <p>Generate your first schedule to get started.</p>
                                    </div>
                                ) : (
                                    <Table responsive hover>
                                        <thead>
                                        <tr>
                                            <th>Week</th>
                                            <th>Status</th>
                                            <th>Site</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {schedules.map(schedule => (
                                            <tr key={schedule.id}>
                                                <td>
                                                    {new Date(schedule.start_date).toLocaleDateString()} -
                                                    {new Date(schedule.end_date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <Badge bg={
                                                        schedule.status === 'published' ? 'success' :
                                                            schedule.status === 'draft' ? 'warning' : 'secondary'
                                                    }>
                                                        {schedule.status}
                                                    </Badge>
                                                </td>
                                                {/* ИСПРАВЛЕНИЕ: правильное обращение к site_name */}
                                                <td>{schedule.workSite?.site_name || schedule.site_name || 'Unknown'}</td>
                                                <td>{new Date(schedule.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => viewScheduleDetails(schedule.id)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>

                    <Tab eventKey="view" title="Schedule Details" disabled={!selectedSchedule}>
                        {scheduleDetails && (
                            <div>
                                {/* Schedule Header */}
                                <Card className="mb-4">
                                    <Card.Body>
                                        <Row>
                                            <Col md={8}>
                                                <h5>Week: {new Date(scheduleDetails.schedule.start_date).toLocaleDateString()} - {new Date(scheduleDetails.schedule.end_date).toLocaleDateString()}</h5>
                                                <p className="text-muted mb-0">
                                                    Site: {scheduleDetails.schedule.work_site?.site_name || 'Unknown'} |
                                                    Status: <Badge bg={scheduleDetails.schedule.status === 'published' ? 'success' : 'warning'}>
                                                    {scheduleDetails.schedule.status}
                                                </Badge>
                                                </p>
                                            </Col>
                                            <Col md={4} className="text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <Button variant="outline-secondary" size="sm">
                                                        <i className="bi bi-download me-1"></i>
                                                        Export
                                                    </Button>
                                                    <Button variant="outline-primary" size="sm">
                                                        <i className="bi bi-copy me-1"></i>
                                                        Duplicate
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Position Schedules */}
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Position Schedules</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {scheduleDetails.schedule_matrix &&
                                            Object.entries(scheduleDetails.schedule_matrix).map(([positionId, positionData]) =>
                                                renderPositionSchedule(positionId, positionData)
                                            )
                                        }
                                    </Card.Body>
                                </Card>
                            </div>
                        )}
                    </Tab>
                </Tabs>

                {/* Employee Selection Modal */}
                <Modal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{MESSAGES.SELECT} Employee</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loadingRecommendations ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" />
                                <div className="mt-2">Loading recommendations...</div>
                            </div>
                        ) : recommendations ? (
                            <div>
                                <h6 className="text-success">{MESSAGES.AVAILABLE} ({recommendations.recommendations.available?.length || 0})</h6>
                                <div className="mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {recommendations.recommendations.available?.map(emp => (
                                        <div key={emp.emp_id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                                            <div>
                                                <strong>{emp.first_name} {emp.last_name}</strong>
                                                <br/>
                                                <small className="text-muted">ID: {emp.emp_id}</small>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => handleEmployeeAssign(emp.emp_id, `${emp.first_name} ${emp.last_name}`)}
                                            >
                                                {MESSAGES.SELECT}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>No recommendations available</div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEmployeeModal(false)}>
                            {MESSAGES.CANCEL}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Generate Schedule Modal */}
                <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <i className="bi bi-plus-circle me-2"></i>
                            {MESSAGES.GENERATE_SCHEDULE}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-calendar me-2"></i>
                                            Week Start Date
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={generateSettings.weekStart}
                                            onChange={(e) => setGenerateSettings(prev => ({
                                                ...prev,
                                                weekStart: e.target.value
                                            }))}
                                        />
                                        <Form.Text className="text-muted">
                                            Select the Sunday that starts the week to schedule.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-building me-2"></i>
                                            Site ID
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={generateSettings.site_id}
                                            onChange={(e) => setGenerateSettings(prev => ({
                                                ...prev,
                                                site_id: parseInt(e.target.value) || 1
                                            }))}
                                            min="1"
                                        />
                                        <Form.Text className="text-muted">
                                            The workplace site to generate schedule for.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    <i className="bi bi-cpu me-2"></i>
                                    Algorithm
                                </Form.Label>
                                <Form.Select
                                    value={generateSettings.algorithm}
                                    onChange={(e) => setGenerateSettings(prev => ({
                                        ...prev,
                                        algorithm: e.target.value
                                    }))}
                                >
                                    <option value="auto">Auto (Recommended) - Selects best available algorithm</option>
                                    <option value="cp-sat">CP-SAT (Advanced) - Google OR-Tools constraint solver</option>
                                    <option value="simple">Simple Assignment - Basic round-robin assignment</option>
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Choose the scheduling algorithm. Auto mode will select the best available option.
                                </Form.Text>
                            </Form.Group>

                            {/* Generation Progress */}
                            {generating && (
                                <div className="mt-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <Spinner size="sm" className="me-2" />
                                        <span>Generating schedule...</span>
                                    </div>
                                    <ProgressBar
                                        animated
                                        now={100}
                                        variant="primary"
                                        className="mb-3"
                                    />
                                    <Alert variant="info" className="mb-0">
                                        <small>
                                            <i className="bi bi-info-circle me-1"></i>
                                            This may take a few moments depending on the complexity of constraints and chosen algorithm.
                                        </small>
                                    </Alert>
                                </div>
                            )}
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowGenerateModal(false)}
                            disabled={generating}
                        >
                            {MESSAGES.CANCEL}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={generateSchedule}
                            disabled={generating || !generateSettings.weekStart}
                        >
                            {generating ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-play-fill me-2"></i>
                                    {MESSAGES.GENERATE_SCHEDULE}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
            {/* Comparison Results Modal */}
            <Modal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} size="lg" className="comparison-modal">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-speedometer2 me-2"></i>
                        Algorithm Comparison Results
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {comparisonResults && (
                        <div>
                            <Alert variant="info" className="mb-4">
                                <h6 className="mb-2">
                                    <i className="bi bi-trophy me-2"></i>
                                    Best Algorithm: <strong>{comparisonResults?.best_algorithm}</strong>
                                </h6>
                                <p className="mb-0">Based on success rate, total assignments, and execution time.</p>
                            </Alert>

                            <Row className="justify-content-center">
                                {Object.entries(comparisonResults.comparison)
                                    .filter(([algorithm, result]) => algorithm !== 'recommended')
                                    .map(([algorithm, result]) => (
                                        <Col md={6} lg={5} key={algorithm} className="mb-4"> {/* Изменить с md={4} на md={6} lg={5} */}
                                            <Card className={`h-100 ${comparisonResults.best_algorithm === algorithm ? 'border-success' : ''}`}>
                                                <Card.Header className={`text-center ${comparisonResults.best_algorithm === algorithm ? 'bg-success text-white' : 'bg-light'}`}>
                                                    <h6 className="mb-0">
                                                        {algorithm.toUpperCase()}
                                                        {comparisonResults.best_algorithm === algorithm && (
                                                            <i className="bi bi-trophy ms-2"></i>
                                                        )}
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    {/* Остальной контент карточки остается тем же */}
                                                    <div className="mb-3">
                                                        <Badge bg={result.status === 'success' ? 'success' : 'danger'} className="mb-2">
                                                            {result.status}
                                                        </Badge>
                                                    </div>

                                                    {result.status === 'success' ? (
                                                        <div>
                                                            <div className="mb-2">
                                                                <strong>Assignments:</strong> {result.stats?.total_assignments || result.assignments_count || 0}
                                                            </div>
                                                            <div className="mb-2">
                                                                <strong>Execution Time:</strong> {result.solve_time || 'N/A'}
                                                            </div>
                                                            {result.stats?.employees_used && (
                                                                <div className="mb-2">
                                                                    <strong>Employees Used:</strong> {result.stats.employees_used}
                                                                </div>
                                                            )}
                                                            {result.stats?.coverage_percentage && (
                                                                <div className="mb-2">
                                                                    <strong>Coverage:</strong> {result.stats.coverage_percentage}%
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

                            {comparisonResults.recommendation && (
                                <Alert variant="warning" className="mt-4">
                                    <h6><i className="bi bi-lightbulb me-2"></i>Recommendation</h6>
                                    <p className="mb-0">{comparisonResults.recommendation}</p>
                                </Alert>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowComparisonModal(false)}>
                        Close
                    </Button>
                    {comparisonResults?.best_algorithm && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setGenerateSettings(prev => ({
                                    ...prev,
                                    algorithm: comparisonResults?.best_algorithm
                                }));
                                setShowComparisonModal(false);
                                setShowGenerateModal(true);
                            }}
                        >
                            Use {comparisonResults?.best_algorithm} Algorithm
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
};

export default ScheduleManagement;