// frontend/src/features/employee-schedule/index.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Spinner } from 'react-bootstrap';
import './index.css';

const WeeklySchedule = () => {
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // View modes: 'personal' | 'full' | 'desktop-full'
    const [viewMode, setViewMode] = useState('personal');

    useEffect(() => {
        fetchScheduleData();
    }, []);

    const fetchScheduleData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await fetch('http://localhost:5000/api/schedules/weekly', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setScheduleData(data);
            setCurrentUser(data.current_employee);

        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getShiftIcon = (shiftType) => {
        switch (shiftType) {
            case 'morning': return <i className="bi bi-sunrise"></i>;
            case 'day': return <i className="bi bi-sun"></i>;
            case 'night': return <i className="bi bi-moon-stars"></i>;
            default: return null;
        }
    };

    const getShiftClass = (shiftType) => {
        switch (shiftType) {
            case 'morning': return 'shift-morning';
            case 'day': return 'shift-afternoon';
            case 'night': return 'shift-night';
            default: return '';
        }
    };

    const formatTime = (startTime, duration) => {
        const [hours, minutes] = startTime.split(':');
        const start = parseInt(hours);
        const endHour = (start + duration) % 24;
        const endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;
        // Remove seconds from time format
        const cleanStart = startTime.substring(0, 5); // 14:00:00 -> 14:00
        const cleanEnd = endTime.substring(0, 5);     // 22:00:00 -> 22:00
        return `${cleanStart}-${cleanEnd}`;
    };

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        return days[date.getDay()];
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const getUserPersonalSchedule = () => {
        if (!scheduleData || !currentUser) return [];

        const personalSchedule = [];
        scheduleData.schedule.forEach(day => {
            let userShift = null;
            day.shifts.forEach(shift => {
                const userInShift = shift.employees.find(emp => emp.emp_id === currentUser.emp_id);
                if (userInShift) {
                    userShift = {
                        shift_name: shift.shift_name,
                        shift_type: shift.shift_type,
                        time: formatTime(shift.start_time, shift.duration)
                    };
                }
            });

            personalSchedule.push({
                date: day.date,
                day_name: getDayName(day.date),
                shift: userShift
            });
        });

        return personalSchedule;
    };

    const renderPersonalSchedule = () => {
        const personalSchedule = getUserPersonalSchedule();

        return (
            <Card className="shadow employee-schedule">
                <Card.Header className="text-center bg-secondary text-white">
                    <h5 className="mb-0">לוח זמנים עבור: {currentUser?.name}</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="table-header text-center" style={{width: '40%'}}>
                                יום<br/><small>תאריך</small>
                            </th>
                            <th className="text-center" style={{width: '60%'}}>משמרת</th>
                        </tr>
                        </thead>
                        <tbody>
                        {personalSchedule.map((day, index) => (
                            <tr key={index} className={day.shift ? getShiftClass(day.shift.shift_type) : 'employee-not-working-row'}>
                                <td className="text-center align-middle employee-date-cell">
                                    {day.day_name}<br/>
                                    <small>{formatDate(day.date)}</small>
                                </td>
                                <td className="text-center">
                                    {day.shift ? (
                                        <>
                                            {day.shift.shift_name}<br/>
                                            <small>{day.shift.time}</small>
                                        </>
                                    ) : '-'}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        );
    };

    const renderDesktopFullSchedule = () => {
        if (!scheduleData?.schedule?.length) return null;

        // Group shifts by type for table rows
        const shiftTypes = ['morning', 'day', 'night'];
        const shifts = scheduleData.schedule[0]?.shifts || [];

        return (
            <Card className="shadow desktop-schedule">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0">
                            <thead>
                            <tr className="table-header">
                                <th className="text-center" style={{width: '15%'}}>עמדה</th>
                                {scheduleData.schedule.map(day => (
                                    <th key={day.date} className="text-center">
                                        {getDayName(day.date)}<br/>
                                        <small>{formatDate(day.date)}</small>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {shiftTypes.map(shiftType => {
                                const shift = shifts.find(s => s.shift_type === shiftType);
                                if (!shift) return null;

                                return (
                                    <tr key={shiftType}>
                                        <td className="shift-header align-middle text-center">
                                            {getShiftIcon(shiftType)}<br/>
                                            {formatTime(shift.start_time, shift.duration)}
                                        </td>
                                        {scheduleData.schedule.map(day => {
                                            const dayShift = day.shifts.find(s => s.shift_type === shiftType);
                                            const employees = dayShift?.employees || [];

                                            return (
                                                <td key={`${day.date}-${shiftType}`}
                                                    className={`${getShiftClass(shiftType)} text-center`}>
                                                    {employees.map((emp, idx) => (
                                                        <div key={idx} className={emp.is_current_user ? 'fw-bold text-primary' : ''}>
                                                            {emp.name.split(' ')[0]}
                                                        </div>
                                                    ))}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    const renderMobileFullSchedule = () => {
        if (!scheduleData?.schedule?.length) return null;

        return (
            <Card className="shadow mobile-schedule-general" dir="ltr">
                <Card.Body className="p-0">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="shift-name-header shift-night text-center">
                                לילה<br/><small>22:00-06:00</small>
                            </th>
                            <th className="shift-name-header shift-afternoon text-center">
                                צהריים<br/><small>14:00-22:00</small>
                            </th>
                            <th className="shift-name-header shift-morning text-center">
                                בוקר<br/><small>06:00-14:00</small>
                            </th>
                            <th className="day-date-col table-header text-center">
                                יום<br/><small>תאריך</small>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {scheduleData.schedule.map(day => (
                            <tr key={day.date}>
                                {['night', 'day', 'morning'].map(shiftType => {
                                    const shift = day.shifts.find(s => s.shift_type === shiftType);
                                    const employees = shift?.employees || [];

                                    return (
                                        <td key={shiftType} className={`${getShiftClass(shiftType)} text-center`}>
                                            {employees.map((emp, idx) => (
                                                <div key={idx} className={emp.is_current_user ? 'fw-bold text-primary' : ''}>
                                                    {emp.name.split(' ')[0]}
                                                    {idx < employees.length - 1 && <br/>}
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                                <td className="day-date-col text-center align-middle">
                                    {getDayName(day.date)}<br/>
                                    <small>{formatDate(day.date)}</small>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container className="schedule-container text-center">
                <Spinner animation="border" role="status" className="m-4">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>טוען לוח זמנים...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="schedule-container">
                <Alert variant="danger">
                    <Alert.Heading>שגיאה בטעינת לוח הזמנים</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchScheduleData}>
                        נסה שוב
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!scheduleData?.schedule?.length) {
        return (
            <Container className="schedule-container">
                <Alert variant="info">
                    <Alert.Heading>אין לוח זמנים זמין</Alert.Heading>
                    <p>לא נמצא לוח זמנים מפורסם עבור השבוע הזה.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="schedule-container">
            <div className="text-center mb-4">
                <h1 className="display-4 text-dark">לוח זמנים שבועי</h1>
                <p className="text-muted">
                    {scheduleData.week.start} - {scheduleData.week.end}
                </p>
            </div>

            {/* View Mode Controls */}
            <div className="text-center mb-4">
                <div className="button-group-custom">
                    <Button
                        variant={viewMode === 'personal' ? 'primary' : 'outline-primary'}
                        onClick={() => setViewMode('personal')}
                        className="rounded-button"
                    >
                        לוח אישי
                    </Button>
                    <Button
                        variant={viewMode === 'full' ? 'primary' : 'outline-primary'}
                        onClick={() => setViewMode('full')}
                        className="rounded-button d-md-none"
                    >
                        סידור מלא
                    </Button>
                    <Button
                        variant={viewMode === 'full' ? 'primary' : 'outline-primary'}
                        onClick={() => setViewMode('full')}
                        className="rounded-button d-none d-md-inline-block"
                    >
                        סידור מלא
                    </Button>
                    <Button
                        variant={viewMode === 'desktop-full' ? 'primary' : 'outline-primary'}
                        onClick={() => setViewMode('desktop-full')}
                        className="rounded-button d-md-none"
                    >
                        תצוגת מחשב
                    </Button>
                </div>
            </div>

            {/* Schedule Views */}
            {viewMode === 'personal' && renderPersonalSchedule()}

            {viewMode === 'full' && (
                <>
                    <div className="d-none d-md-block">
                        {renderDesktopFullSchedule()}
                    </div>
                    <div className="d-md-none">
                        {renderMobileFullSchedule()}
                    </div>
                </>
            )}

            {viewMode === 'desktop-full' && (
                <div className="d-md-none">
                    <div style={{overflowX: 'auto'}}>
                        {renderDesktopFullSchedule()}
                    </div>
                </div>
            )}
        </Container>
    );
};

export default WeeklySchedule;