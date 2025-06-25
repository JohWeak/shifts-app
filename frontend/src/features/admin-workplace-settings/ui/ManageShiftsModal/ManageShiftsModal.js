// frontend/src/features/admin-workplace-settings/ui/ManageShiftsModal/ManageShiftsModal.js
import React, { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Table,
    Badge,
    Alert,
    Form,
    Row,
    Col,
    Card,
    OverlayTrigger,
    Tooltip, Nav
} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import ShiftForm from '../ShiftForm/ShiftForm';
import ShiftRequirementsMatrix from '../ShiftRequirementsMatrix/ShiftRequirementsMatrix';
import api from 'shared/api';
import { API_ENDPOINTS } from 'shared/config/apiEndpoints';

import './ManageShiftsModal.css';

const ManageShiftsModal = ({ show, onHide, position }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [activeView, setActiveView] = useState('shifts'); // 'shifts' or 'matrix'

    useEffect(() => {
        if (show && position) {
            fetchShifts();
        }
    }, [show, position]);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/positions/${position.pos_id}/shifts`, {
                params: { includeRequirements: true }
            });
            setShifts(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load shifts');
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
        <>
            <Modal show={show} onHide={onHide} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t('workplace.shifts.manageTitle')} - {position.pos_name}
                        <small className="text-muted ms-2">
                            ({position.workSite?.site_name || position.site_name})
                        </small>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
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

                        {activeView === 'shifts' && (
                            <Button variant="primary" size="sm" onClick={handleAddShift}>
                                <i className="bi bi-plus-circle me-2"></i>
                                {t('workplace.shifts.addShift')}
                            </Button>
                        )}
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
                                                    style={{ backgroundColor: shift.color }}
                                                />
                                                <strong>{shift.shift_name}</strong>
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
                        />
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        {t('common.close')}
                    </Button>
                </Modal.Footer>
            </Modal>

            {showShiftForm && (
                <ShiftForm
                    show={showShiftForm}
                    onHide={handleShiftFormClose}
                    onSuccess={handleShiftFormSuccess}
                    positionId={position.pos_id}
                    shift={selectedShift}
                />
            )}
        </>
    );
};

export default ManageShiftsModal;