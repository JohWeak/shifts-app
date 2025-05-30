// frontend/src/components/employee/constraints/ConstraintsSchedule.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import './ConstraintsSchedule.css';

const ConstraintsSchedule = () => {
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentMode, setCurrentMode] = useState('cannot_work'); // 'cannot_work' | 'prefer_work'
    const [constraints, setConstraints] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [limitError, setLimitError] = useState('');
    const [shakeEffect, setShakeEffect] = useState(false);

    useEffect(() => {
        fetchConstraintsTemplate();
    }, []);

    const fetchConstraintsTemplate = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await fetch('http://localhost:5000/api/constraints/next-week-template', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setTemplateData(data);

            // Build initial constraints state from template
            const initialConstraints = {};
            data.constraints.template.forEach(day => {
                initialConstraints[day.date] = {
                    day_status: 'neutral',
                    shifts: {}
                };
                day.shifts.forEach(shift => {
                    initialConstraints[day.date].shifts[shift.shift_type] = shift.status;
                });
            });
            setConstraints(initialConstraints);

        } catch (err) {
            console.error('Error fetching constraints template:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const triggerShakeEffect = () => {
        setShakeEffect(true);
        setTimeout(() => setShakeEffect(false), 500);
    };

    const checkLimits = (newConstraints, modeToCheck) => {
        let count = 0;
        Object.keys(newConstraints).forEach(date => {
            const dayConstraints = newConstraints[date];
            // Check if whole day has this constraint
            if (dayConstraints.day_status === modeToCheck) {
                count++;
            } else {
                // Check if any shift has this constraint
                const hasShiftConstraint = Object.values(dayConstraints.shifts).some(status => status === modeToCheck);
                if (hasShiftConstraint) {
                    count++;
                }
            }
        });

        const limits = templateData?.constraints?.limits;
        if (modeToCheck === 'cannot_work' && count > limits?.cannot_work_days) {
            return `מקסימום ${limits.cannot_work_days} ימים של "לא יכול לעבוד"`;
        }
        if (modeToCheck === 'prefer_work' && count > limits?.prefer_work_days) {
            return `מקסימום ${limits.prefer_work_days} ימים של "מעדיף לעבוד"`;
        }
        return null;
    };

    const handleCellClick = (date, shiftType = null) => {
        if (!templateData?.constraints?.can_edit || submitted) {
            return; // Can't edit if deadline passed or already submitted
        }

        setLimitError('');

        const newConstraints = { ...constraints };
        const dayConstraints = { ...newConstraints[date] };

        if (shiftType) {
            // Clicking on specific shift
            const currentStatus = dayConstraints.shifts[shiftType];

            if (currentStatus === currentMode) {
                // Same mode - set to neutral
                dayConstraints.shifts[shiftType] = 'neutral';
            } else {
                // Different mode - check limits first
                const testConstraints = { ...newConstraints };
                testConstraints[date] = {
                    ...dayConstraints,
                    shifts: {
                        ...dayConstraints.shifts,
                        [shiftType]: currentMode
                    }
                };

                const limitError = checkLimits(testConstraints, currentMode);
                if (limitError) {
                    setLimitError(limitError);
                    triggerShakeEffect();
                    return;
                }

                // Set new mode
                dayConstraints.shifts[shiftType] = currentMode;

                // If whole day was in opposite mode, clear it
                if (dayConstraints.day_status !== 'neutral' && dayConstraints.day_status !== currentMode) {
                    dayConstraints.day_status = 'neutral';
                    // Set other shifts to neutral if they were part of day constraint
                    Object.keys(dayConstraints.shifts).forEach(type => {
                        if (type !== shiftType && dayConstraints.shifts[type] === dayConstraints.day_status) {
                            dayConstraints.shifts[type] = 'neutral';
                        }
                    });
                }
            }
        } else {
            // Clicking on whole day
            if (dayConstraints.day_status === currentMode) {
                // Same mode - set whole day to neutral
                dayConstraints.day_status = 'neutral';
                Object.keys(dayConstraints.shifts).forEach(type => {
                    dayConstraints.shifts[type] = 'neutral';
                });
            } else {
                // Different mode - check limits first
                const testConstraints = { ...newConstraints };
                testConstraints[date] = {
                    day_status: currentMode,
                    shifts: {}
                };
                Object.keys(dayConstraints.shifts).forEach(type => {
                    testConstraints[date].shifts[type] = currentMode;
                });

                const limitError = checkLimits(testConstraints, currentMode);
                if (limitError) {
                    setLimitError(limitError);
                    triggerShakeEffect();
                    return;
                }

                // Set whole day to current mode
                dayConstraints.day_status = currentMode;
                Object.keys(dayConstraints.shifts).forEach(type => {
                    dayConstraints.shifts[type] = currentMode;
                });
            }
        }

        newConstraints[date] = dayConstraints;
        setConstraints(newConstraints);
    };

    const getCellClass = (date, shiftType = null) => {
        if (!constraints[date]) return 'constraint-cell neutral';

        const dayConstraints = constraints[date];
        let status = 'neutral';

        if (shiftType) {
            status = dayConstraints.shifts[shiftType] || 'neutral';
        } else {
            status = dayConstraints.day_status || 'neutral';
        }

        const baseClass = 'constraint-cell';
        const statusClass = status === 'cannot_work' ? 'cannot-work' :
            status === 'prefer_work' ? 'prefer-work' : 'neutral';
        const clickableClass = templateData?.constraints?.can_edit && !submitted ? 'clickable' : '';

        return `${baseClass} ${statusClass} ${clickableClass}`;
    };

    const getShiftIcon = (shiftType) => {
        switch (shiftType) {
            case 'morning': return <i className="bi bi-sunrise"></i>;
            case 'day': return <i className="bi bi-sun"></i>;
            case 'night': return <i className="bi bi-moon-stars"></i>;
            default: return null;
        }
    };

    const formatTime = (startTime, duration) => {
        const [hours, minutes] = startTime.split(':');
        const start = parseInt(hours);
        const endHour = (start + duration) % 24;
        const endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;
        const cleanStart = startTime.substring(0, 5);
        const cleanEnd = endTime.substring(0, 5);
        return `${cleanStart}-${cleanEnd}`;
    };

    const handleSubmit = async () => {
        // TODO: Implement submission logic
        console.log('Submitting constraints:', constraints);
        setSubmitted(true);
    };

    const handleEdit = () => {
        setSubmitted(false);
    };

    if (loading) {
        return (
            <Container className="constraints-container text-center">
                <Spinner animation="border" role="status" className="m-4">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>טוען תבנית אילוצים...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="constraints-container">
                <Alert variant="danger">
                    <Alert.Heading>שגיאה בטעינת תבנית אילוצים</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchConstraintsTemplate}>
                        נסה שוב
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!templateData?.constraints?.template?.length) {
        return (
            <Container className="constraints-container">
                <Alert variant="info">
                    <Alert.Heading>אין תבנית זמינה</Alert.Heading>
                    <p>לא ניתן לטעון תבנית אילוצים לשבוע הבא.</p>
                </Alert>
            </Container>
        );
    }

    const canEdit = true //templateData.constraints.can_edit && !templateData.constraints.deadline_passed;

    return (
        <Container className={`constraints-container ${shakeEffect ? 'shake' : ''}`}>
            <div className="text-center mb-4">
                <h1 className="display-4 text-dark">אילוצי עבודה</h1>
                <p className="text-muted">
                    שבוע: {templateData.week.start} - {templateData.week.end}
                </p>
                {templateData.constraints.deadline_passed && (
                    <Alert variant="warning">
                        זמן הגשת האילוצים הסתיים ב-{new Date(templateData.constraints.deadline).toLocaleString('he-IL')}
                    </Alert>
                )}
            </div>

            {/* Control Buttons */}
            {canEdit && !submitted && (
                <div className="text-center mb-4">
                    <div className="constraint-controls">
                        <Button
                            variant={currentMode === 'cannot_work' ? 'danger' : 'outline-danger'}
                            onClick={() => setCurrentMode('cannot_work')}
                            className="rounded-button"
                        >
                            לא עובד
                        </Button>
                        <Button
                            variant={currentMode === 'prefer_work' ? 'success' : 'outline-success'}
                            onClick={() => setCurrentMode('prefer_work')}
                            className="rounded-button"
                        >
                            מעדיף לעבוד
                        </Button>
                    </div>
                </div>
            )}

            {/* Desktop Table */}
            <Card className="shadow desktop-constraints d-none d-md-block">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0">
                            <thead>
                            <tr className="table-header">
                                <th className="text-center" style={{width: '15%'}}>יום</th>
                                {templateData.constraints.template.map(day => (
                                    <th key={day.date}
                                        className={`text-center ${getCellClass(day.date)}`}
                                        onClick={() => handleCellClick(day.date)}
                                    >
                                        {day.day_name}<br/>
                                        <small>{day.display_date}</small>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {['morning', 'day', 'night'].map(shiftType => {
                                const sampleShift = templateData.constraints.template[0].shifts.find(s => s.shift_type === shiftType);
                                if (!sampleShift) return null;

                                return (
                                    <tr key={shiftType}>
                                        <td className="shift-header align-middle text-center">
                                            {getShiftIcon(shiftType)}<br/>
                                            {formatTime(sampleShift.start_time, sampleShift.duration)}
                                        </td>
                                        {templateData.constraints.template.map(day => (
                                            <td key={`${day.date}-${shiftType}`}
                                                className={getCellClass(day.date, shiftType)}
                                                onClick={() => handleCellClick(day.date, shiftType)}
                                            >
                                                {/* Empty cell for user interaction */}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Mobile Table */}
            <Card className="shadow mobile-constraints d-md-none">
                <Card.Body className="p-0">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="text-center">יום</th>
                            <th className="shift-header text-center">בוקר</th>
                            <th className="shift-header text-center">צהריים</th>
                            <th className="shift-header text-center">לילה</th>
                        </tr>
                        </thead>
                        <tbody>
                        {templateData.constraints.template.map(day => (
                            <tr key={day.date}>
                                <td className={`text-center ${getCellClass(day.date)}`}
                                    onClick={() => handleCellClick(day.date)}
                                >
                                    {day.day_name}<br/>
                                    <small>{day.display_date}</small>
                                </td>
                                {['morning', 'day', 'night'].map(shiftType => (
                                    <td key={shiftType}
                                        className={getCellClass(day.date, shiftType)}
                                        onClick={() => handleCellClick(day.date, shiftType)}
                                    >
                                        {/* Empty cell for user interaction */}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Error Message */}
            {limitError && (
                <Alert variant="danger" className="mt-3">
                    {limitError}
                </Alert>
            )}

            {/* Submit/Edit Controls */}
            <div className="text-center mt-4">
                {canEdit && (
                    <>
                        {!submitted ? (
                            <Button variant="primary" onClick={handleSubmit} className="rounded-button">
                                שלח
                            </Button>
                        ) : (
                            <Button variant="secondary" onClick={handleEdit} className="rounded-button">
                                ערוך
                            </Button>
                        )}
                    </>
                )}
            </div>
        </Container>
    );
};

export default ConstraintsSchedule;