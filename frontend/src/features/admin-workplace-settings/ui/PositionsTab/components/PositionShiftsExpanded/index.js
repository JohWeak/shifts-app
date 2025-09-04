// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionShiftsExpanded/index.js
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Badge, Button, Card, Nav, OverlayTrigger, Spinner, Tab, Table, Tooltip} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {AnimatePresence} from 'motion/react';
import * as motion from "motion/react-client"
import {deletePositionShift, fetchPositionShifts, restorePositionShift} from '../../../../model/workplaceSlice';
import {addNotification} from 'app/model/notificationsSlice';
import ShiftForm from './components/ShiftForm';
import ShiftRequirementsMatrix from './components/ShiftRequirementsMatrix';
import WorkplaceActionButtons from "../../../WorkplaceActionButtons";
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import './PositionShiftsExpanded.css';

const PositionShiftsExpanded = ({position, isClosing}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const [showShiftForm, setShowShiftForm] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [activeView, setActiveView] = useState('shifts'); // 'shifts' or 'matrix'
    const [showInactive, setShowInactive] = useState(() =>
        localStorage.getItem('showInactiveShifts') === 'true');
    
    // Confirmation modals state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [shiftToProcess, setShiftToProcess] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const {positionShifts, shiftsLoading} = useSelector(state => state.workplace);
    const cacheKey = `${position?.pos_id}_all`;
    const allShifts = positionShifts[cacheKey] || positionShifts[position?.pos_id] || [];

    // Filter shifts based on showInactive toggle
    const shifts = showInactive
        ? allShifts
        : allShifts.filter(shift => shift.is_active !== false);
        

    const isLoading = shiftsLoading && allShifts.length === 0;

    useEffect(() => {
        if (position?.pos_id) {
            dispatch(fetchPositionShifts({positionId: position.pos_id, includeInactive: true}));
        }
    }, [dispatch, position?.pos_id]);

    const handleShowInactiveChange = (e) => {
        const show = e.target.checked;
        setShowInactive(show);
        localStorage.setItem('showInactiveShifts', show);
    };

    const handleMatrixUpdate = () => {
        // Matrix updates don't affect shift list, no need to refetch
    };

    const handleAddShift = () => {
        setSelectedShift(null);
        setShowShiftForm(true);
    };

    const handleEditShift = (shift) => {
        setSelectedShift(shift);
        setShowShiftForm(true);
    };

    const handleDeleteShift = (shift) => {
        setShiftToProcess(shift);
        setShowDeleteModal(true);
    };

    const handleRestoreShift = (shift) => {
        setShiftToProcess(shift);
        setShowRestoreModal(true);
    };

    const confirmDeleteShift = async () => {
        if (!shiftToProcess) return;

        setActionLoading(true);
        try {
            await dispatch(deletePositionShift(shiftToProcess.id)).unwrap();
            dispatch(addNotification({
                variant: 'success',
                message: t('workplace.shifts.deleteSuccess'),
                duration: 3000
            }));

            setShowDeleteModal(false);
            setShiftToProcess(null);
        } catch (err) {
            // err is the unwrapped error from the rejected action
            console.log('Delete error:', err);
            // Try different possible error message locations
            const errorMessage = typeof err === 'string' ? err : 
                err.data?.message || err.message || err.error?.message || t('workplace.shifts.deleteFailed');
            dispatch(addNotification({
                variant: 'danger',
                message: errorMessage
                // duration will be set automatically to 8000ms for danger variant
            }));
        } finally {
            setActionLoading(false);
        }
    };

    const confirmRestoreShift = async () => {
        if (!shiftToProcess) return;

        setActionLoading(true);
        try {
            await dispatch(restorePositionShift(shiftToProcess.id)).unwrap();
            dispatch(addNotification({
                variant: 'success',
                message: t('workplace.shifts.restoreSuccess'),
                duration: 3000
            }));

            setShowRestoreModal(false);
            setShiftToProcess(null);
        } catch (err) {
            // err is the unwrapped error from the rejected action
            console.log('Restore error:', err);
            // Try different possible error message locations
            const errorMessage = typeof err === 'string' ? err : 
                err.data?.message || err.message || err.error?.message || t('workplace.shifts.restoreFailed');
            dispatch(addNotification({
                variant: 'danger',
                message: errorMessage
                // duration will be set automatically to 8000ms for danger variant
            }));
        } finally {
            setActionLoading(false);
        }
    };

    const handleModalCancel = () => {
        if (actionLoading) return; // Prevent closing during loading
        setShowDeleteModal(false);
        setShowRestoreModal(false);
        setShiftToProcess(null);
    };

    const handleShiftFormClose = () => {
        setShowShiftForm(false);
        setSelectedShift(null);
    };

    const handleShiftFormSuccess = () => {
        setShowShiftForm(false);
        setSelectedShift(null);
        // No need to refetch - the slice will handle the update optimistically
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

    const tabContentVariants = {
        initial: {opacity: 0, y: -10},
        animate: {opacity: 1, y: 0, transition: {duration: 0.15, ease: 'easeInOut'}},
        exit: {opacity: 0, y: 10, transition: {duration: 0.15, ease: 'easeInOut'}}
    };

    if (!position) return null;

    return (
        <tr className="position-shifts-row">
            <td colSpan="8" className="position-shifts-col p-0">
                <div className={`position-shifts-expanded ${isClosing ? 'closing' : ''}`}>
                    <Card>
                        <Card.Body className='position-shifts-card'>
                            <Tab.Container activeKey={activeView} onSelect={(k) => setActiveView(k)}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Nav variant="pills" activeKey={activeView} onSelect={setActiveView}>
                                        <Nav.Item>
                                            <Nav.Link eventKey="shifts">
                                                <i className="bi bi-clock me-2"></i>
                                                {t('workplace.shifts.shiftsTab')}
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="matrix" disabled={allShifts.filter(shift => shift.is_active !== false).length === 0}>
                                                <i className="bi bi-grid-3x3 me-2"></i>
                                                {t('workplace.shifts.requirementsTab')}
                                            </Nav.Link>
                                        </Nav.Item>
                                    </Nav>

                                    {activeView === 'shifts' && (
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="showInactiveShifts"
                                                checked={showInactive}
                                                onChange={handleShowInactiveChange}
                                            />
                                            <label className="form-check-label text-muted small"
                                                   htmlFor="showInactiveShifts">
                                                {t('workplace.shifts.showInactive', 'Show Inactive')}
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeView}
                                        variants={tabContentVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                    >
                                        {activeView === 'shifts' && (
                                            <>
                                                {isLoading ? (
                                                    <div className="text-center py-5">
                                                        <Spinner
                                                            animation="border"
                                                            variant="primary"
                                                        />
                                                    </div>
                                                ) : shifts.length === 0 ? (
                                                    <Card className="text-center border-0 py-5">
                                                        <Card.Body>
                                                            <i className="bi bi-clock display-4 text-muted mb-3"></i>
                                                            <p className="text-muted">{t('workplace.shifts.noShifts')}</p>
                                                            <Button variant="primary" onClick={handleAddShift}
                                                                    className="p-3 rounded-3">
                                                                <i className="bi bi-plus-circle me-2"></i>
                                                                {t('workplace.shifts.createFirst')}
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                ) : (
                                                    <Table responsive>
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
                                                            <tr key={shift.id}
                                                                className={!shift.is_active ? ' opacity-50' : ''}>
                                                                <td>
                                                                    <div
                                                                        className="d-flex align-items-center justify-content-between">
                                                                        <div className="d-flex align-items-center">
                                                                            <div
                                                                                className="shift-color-indicator me-2"
                                                                                style={{backgroundColor: shift.color}}
                                                                            />
                                                                            <span>{shift.shift_name}</span>
                                                                        </div>
                                                                        {!shift.is_active && (
                                                                            <Badge bg="secondary" className="ms-auto">
                                                                                {t('common.inactive')}
                                                                            </Badge>
                                                                        )}
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
                                                                    <WorkplaceActionButtons
                                                                        item={shift}
                                                                        onEdit={() => handleEditShift(shift)}
                                                                        onDelete={() => handleDeleteShift(shift)}
                                                                        onRestore={() => handleRestoreShift(shift)}
                                                                    />

                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </Table>
                                                )}
                                            </>
                                        )}
                                        {activeView === 'matrix' && shifts.length > 0 && (
                                            <ShiftRequirementsMatrix
                                                positionId={position?.pos_id}
                                                shifts={allShifts.filter(shift => shift.is_active !== false)}
                                                onUpdate={handleMatrixUpdate}
                                                renderActions={({
                                                                    isChanged,
                                                                    isSaving,
                                                                    handleSave,
                                                                    handleReset
                                                                }) => (
                                                    <div
                                                        className={`card-actions-toolbar ${isChanged ? 'visible' : ''}`}>
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
                                                                    <Spinner as="span" animation="border"
                                                                             size="sm"
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
                                    </motion.div>
                                </AnimatePresence>
                            </Tab.Container>
                        </Card.Body>
                        <div className="position-shifts-expanded-footer d-flex ms-3 mb-3 mt-0">
                            {activeView === 'shifts' && shifts && !(shifts.length === 0) && (
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

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                title={t('workplace.shifts.deleteConfirm', 'Delete Shift')}
                message={shiftToProcess ? 
                    t('workplace.shifts.deleteConfirmMessage', `Are you sure you want to delete shift "${shiftToProcess.shift_name}"?`).replace('{shiftName}', shiftToProcess.shift_name) : 
                    ''
                }
                onConfirm={confirmDeleteShift}
                onHide={handleModalCancel}
                loading={actionLoading}
                variant="danger"
                confirmText={t('common.delete')}
                confirmVariant="danger"
            />

            {/* Restore Confirmation Modal */}
            <ConfirmationModal
                show={showRestoreModal}
                title={t('workplace.shifts.restoreConfirm', 'Restore Shift')}
                message={shiftToProcess ? 
                    t('workplace.shifts.restoreConfirmMessage', `Are you sure you want to restore shift "${shiftToProcess.shift_name}"?`).replace('{shiftName}', shiftToProcess.shift_name) : 
                    ''
                }
                onConfirm={confirmRestoreShift}
                onHide={handleModalCancel}
                loading={actionLoading}
                variant="success"
                confirmText={t('common.restore')}
                confirmVariant="success"
            />
        </tr>
    );
};
export default PositionShiftsExpanded;