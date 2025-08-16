// frontend/src/features/admin-schedule-management/components/ScheduleDetails.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Alert, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useScheduleValidation } from '../../model/hooks/useScheduleValidation';
import { useScheduleDetailsActions } from '../../model/hooks/useScheduleDetailsActions';
import { addNotification } from '../../../../app/model/notificationsSlice';
import {
    updateScheduleAssignments, exportSchedule, toggleEditPosition,
    addPendingChange, removePendingChange, clearAutofilledStatus, applyPendingChanges,
} from '../../model/scheduleSlice';
import ScheduleEditor from './ScheduleEditor';
import ScheduleInfo from './ScheduleInfo';
import ValidationModal from './ValidationModal';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import { useScheduleAutofill } from '../../model/hooks/useScheduleAutofill';
import './ScheduleDetails.css';

const ScheduleDetails = ({ onCellClick, selectedCell }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { scheduleDetails, editingPositions, pendingChanges, loading } = useSelector(state => state.schedule);
    const { autofillPosition, isAutofilling: isPositionAutofilling, isProcessing } = useScheduleAutofill();

    // --- ACTIONS & MODALS HOOK ---
    const { promptPublish, promptUnpublish, promptAutofill, isAutofilling, renderModals } = useScheduleDetailsActions(scheduleDetails?.schedule);

    // --- LOCAL UI STATE ---
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportAlert, setExportAlert] = useState(null);
    const [validationViolations, setValidationViolations] = useState([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [pendingSavePositionId, setPendingSavePositionId] = useState(null);

    // --- HOOKS FOR LOGIC ---
    const { validatePendingChanges } = useScheduleValidation();

    const performSave = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(c => c.positionId === positionId && !c.isApplied);
        setIsSaving(true);
        try {
            await dispatch(updateScheduleAssignments({ scheduleId: scheduleDetails.schedule.id, changes: positionChanges })).unwrap();
            dispatch(applyPendingChanges(positionId));
            const autofilledKeys = positionChanges.filter(c => c.isAutofilled).map(c => `autofill-${c.positionId}-${c.date}-${c.shiftId}-${c.empId}`);
            if (autofilledKeys.length > 0) dispatch(clearAutofilledStatus(autofilledKeys));
            dispatch(addNotification({ variant: 'success', message: t('schedule.saveSuccess') }));
        } catch (error) {
            dispatch(addNotification({ variant: 'error', message: t('schedule.saveFailed') }));
        } finally {
            setIsSaving(false);
            setShowValidationModal(false);
            setPendingSavePositionId(null);
        }
    };

    const handleSaveChanges = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(c => c.positionId === positionId && !c.isApplied);
        if (positionChanges.length === 0) return;
        setIsSaving(true);
        try {
            const violations = await validatePendingChanges();
            if (violations.length > 0) {
                setValidationViolations(violations);
                setPendingSavePositionId(positionId);
                setShowValidationModal(true);
                setIsSaving(false);
                return;
            }
            await performSave(positionId);
        } catch (error) {
            dispatch(addNotification({ type: 'error', message: t('schedule.validationFailed') }));
            setIsSaving(false);
        }
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        setExportAlert(null);
        try {
            const result = await dispatch(exportSchedule({ scheduleId: scheduleDetails.schedule.id, format })).unwrap();
            setExportAlert({ type: 'success', message: `${t('schedule.exportSuccess')}: ${result.filename}` });
        } catch (error) {
            setExportAlert({ type: 'danger', message: `${t('common.error')}: ${error}` });
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportAlert(null), 5000);
        }
    };

    const handleEmployeeRemove = (date, positionId, shiftId, empId, assignmentId = null) => {
        const key = `remove-${positionId}-${date}-${shiftId}-${empId}`;
        dispatch(addPendingChange({ key, change: { action: 'remove', positionId, date, shiftId, empId, assignmentId } }));
    };

    const handleEmployeeClick = (date, positionId, shiftId, empId) => {
        const assignment = scheduleDetails?.assignments?.find(a => (a.pos_id === positionId || a.position_id === positionId) && a.emp_id === empId && a.shift_id === shiftId && (a.work_date === date || a.date === date));
        onCellClick(date, positionId, shiftId, empId, assignment?.id);
    };

    if (!scheduleDetails) return <LoadingState size="lg" message={t('common.loading')} />;

    const isUIBlocked = isProcessing || isAutofilling;

    return (
        <>
            {isUIBlocked && <div className="schedule-processing-overlay"><div className="processing-spinner"><Spinner animation="border" variant="primary" /><p>{t('schedule.processingChanges')}</p></div></div>}

            <Card className={`mb-3 ${isUIBlocked ? 'disabled-card' : ''}`}>
                <Card.Body>
                    <ScheduleInfo
                        schedule={scheduleDetails.schedule}
                        onPublish={promptPublish}
                        onUnpublish={promptUnpublish}
                        onExport={handleExport}
                        isExporting={isExporting}
                        scheduleDetails={scheduleDetails}
                        onAutofill={promptAutofill}
                        isAutofilling={isAutofilling}
                    />
                    {exportAlert && <Alert variant={exportAlert.type} dismissible onClose={() => setExportAlert(null)}>{exportAlert.message}</Alert>}
                </Card.Body>
            </Card>

            <Card className={isUIBlocked ? 'disabled-card' : ''}>
                <Card.Body>
                    {scheduleDetails.positions?.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <ScheduleEditor
                                key={position.pos_id}
                                position={position}
                                schedule={scheduleDetails.schedule}
                                isEditing={!!editingPositions[position.pos_id]}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSaveChanges={() => handleSaveChanges(position.pos_id)}
                                onCellClick={onCellClick}
                                scheduleDetails={scheduleDetails}
                                pendingChanges={pendingChanges}
                                isSaving={isSaving}
                                onEmployeeClick={handleEmployeeClick}
                                onEmployeeRemove={handleEmployeeRemove}
                                onRemovePendingChange={(key) => dispatch(removePendingChange(key))}
                                onAutofill={autofillPosition}
                                isAutofilling={isPositionAutofilling}
                                selectedCell={selectedCell}
                            />
                        ))
                    ) : (
                        <EmptyState icon={<i className="bi bi-person-workspace fs-1"></i>} title={t('position.noPositions')} description="This schedule doesn't have any position assignments yet." />
                    )}
                </Card.Body>
            </Card>

            <ValidationModal
                show={showValidationModal}
                onHide={() => setShowValidationModal(false)}
                onConfirm={() => performSave(pendingSavePositionId)}
                violations={validationViolations}
                title={t('schedule.validationWarning')} />
            {renderModals()}
        </>
    );
};

export default ScheduleDetails;