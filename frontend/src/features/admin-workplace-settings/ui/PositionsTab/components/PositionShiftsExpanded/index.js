// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionShiftsExpanded/index.js
import React, {useState, useEffect} from 'react';
import {
    Modal,
    Button,
    Table,
    Badge,
    Alert,
    Card,
    OverlayTrigger,
    Tooltip, Nav, Spinner
} from 'react-bootstrap';
import {useDispatch} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import ShiftForm from './components/ShiftForm';
import ShiftRequirementsMatrix from './components/ShiftRequirementsMatrix';
import api from 'shared/api';

import './PositionShiftsExpanded.css';

const PositionShiftsExpanded = ({position, onClose, isClosing}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [activeView, setActiveView] = useState('shifts'); // 'shifts' or 'matrix'

    useEffect(() => {
        if (position) {
            fetchShifts();
        }
    }, [position]);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/positions/${position.pos_id}/shifts`, {
                params: {includeRequirements: true}
            });
            // response уже содержит массив благодаря interceptor
            setShifts(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || 'Failed to load shifts');
            setShifts([]); // Устанавливаем пустой массив при ошибке
        } finally {
            setLoading(false);
        }
    };

    const handleAddShift = () => {
        setSelectedShift(null);
        setShowShiftForm(true);
    };

    const handleEditShift = (shift) => {
        setSelectedShift(shift);
        setShowShiftForm(true);
    };

    const handleDeleteShift = async (shiftId) => {
        if (!window.confirm(t('workplace.shifts.deleteConfirm'))) return;

        try {
            await api.delete(`/api/positions/shifts/${shiftId}`);
            await fetchShifts();
        } catch (err) {
            setError(err.message || 'Failed to delete shift');
        }
    };

    const handleShiftFormClose = () => {
        setShowShiftForm(false);
        setSelectedShift(null);
    };

    const handleShiftFormSuccess = () => {
        setShowShiftForm(false);
        setSelectedShift(null);
        fetchShifts();
    };

    const formatTime = (time) => {
        return time ? time.substring(0, 5) : '';
    };

    const getShiftDuration = (shift) => {
        if (!shift.start_time || !shift.end_time) return 0;

        const [startHour, startMin] = shift.start_time.split(':').map(Number);
        const [endHour, endMin] = shift.end_time.split(':').map(Number);

        let duration;
        if (endHour >= startHour) {
            duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        } else {
            duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
        }

        return duration / 60;
    };

    if (!position) return null;

    return (
        <tr className="position-shifts-row">
            <td colSpan="8" className="position-shifts-col p-0">
                <div className={`position-shifts-expanded ${isClosing ? 'closing' : ''}`}>
                    <Card className="m-3">
                        <Card.Body className={"pb-1"}>
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Nav variant="pills" activeKey={activeView} onSelect={setActiveView}>
                                    <Nav.Item>
                                        <Nav.Link eventKey="shifts">
                                            <i className="bi bi-clock me-2"></i>
                                            {t('workplace.shifts.shiftsTab')}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="matrix" disabled={shifts.length === 0}>
                                            <i className="bi bi-grid-3x3 me-2"></i>
                                            {t('workplace.shifts.requirementsTab')}
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </div>
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : activeView === 'shifts' ? (
                                shifts.length === 0 ? (
                                    <Card className="text-center py-5">
                                        <Card.Body>
                                            <i className="bi bi-clock display-4 text-muted mb-3"></i>
                                            <p className="text-muted">{t('workplace.shifts.noShifts')}</p>
                                            <Button variant="primary" onClick={handleAddShift}>
                                                <i className="bi bi-plus-circle me-2"></i>
                                                {t('workplace.shifts.createFirst')}
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    <Table responsive hover>
                                        <thead>
                                        <tr>
                                            <th>{t('workplace.shifts.name')}</th>
                                            <th>{t('workplace.shifts.time')}</th>
                                            <th>{t('workplace.shifts.duration')}</th>
                                            <th>{t('workplace.shifts.type')}</th>
                                            <th>{t('workplace.shifts.staffing')}</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {shifts.map(shift => (
                                            <tr key={shift.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="shift-color-indicator me-2"
                                                            style={{backgroundColor: shift.color}}
                                                        />
                                                        <span>{shift.shift_name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                </td>
                                                <td>
                                                    {getShiftDuration(shift).toFixed(1)} {t('common.hours')}
                                                </td>
                                                <td>
                                                    {shift.is_night_shift && (
                                                        <Badge bg="dark">
                                                            <i className="bi bi-moon-stars me-1"></i>
                                                            {t('workplace.shifts.night')}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip>
                                                                {t('workplace.shifts.defaultStaffing')}
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <Badge bg="info">
                                                            <i className="bi bi-people me-1"></i>
                                                            {shift.requirements?.[0]?.required_staff_count || 1}
                                                        </Badge>
                                                    </OverlayTrigger>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEditShift(shift)}
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteShift(shift.id)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>

                                )
                            ) : (
                                <ShiftRequirementsMatrix
                                    positionId={position.pos_id}
                                    shifts={shifts}
                                    onUpdate={fetchShifts}
                                    renderActions={({isChanged, isSaving, handleSave, handleReset}) => (
                                        <div className={`card-actions-toolbar ${isChanged ? 'visible' : ''}`}>
                                            <Button
                                                variant="outline-secondary"
                                                onClick={handleReset}
                                                disabled={isSaving}
                                            >
                                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                                {t('common.reset')}
                                            </Button>
                                            <Button
                                                variant="success"
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                style={{minWidth: '100px'}}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Spinner as="span" animation="border" size="sm"
                                                                 className="me-2"/>
                                                        {t('common.saving')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-lg me-2"></i>
                                                        {t('common.save')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                />
                            )}
                        </Card.Body>
                        <div className="position-shifts-expanded-footer d-flex ms-3 mb-3 mt-0">
                            {activeView === 'shifts' && (
                                <Button className={"mt-2 p-2 rounded-2"} variant="primary" size="sm"
                                        onClick={handleAddShift}>
                                    <i className="bi bi-plus-circle me-2"></i>
                                    {t('workplace.shifts.addShift')}
                                </Button>

                            )}
                        </div>
                    </Card>
                </div>
            </td>
            {showShiftForm && (
                <ShiftForm
                    show={showShiftForm}
                    onHide={handleShiftFormClose}
                    onSuccess={handleShiftFormSuccess}
                    positionId={position.pos_id}
                    shift={selectedShift}
                />
            )}
        </tr>

);
};

export default PositionShiftsExpanded;