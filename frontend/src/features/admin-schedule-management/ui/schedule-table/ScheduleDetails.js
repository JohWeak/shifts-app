// frontend/src/features/admin-schedule-management/components/ScheduleDetails.js
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Card, Alert, Button, Spinner} from 'react-bootstrap';
import { useScheduleAutofill } from '../../model/hooks/useScheduleAutofill';
import ScheduleEditor from './ScheduleEditor';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import ScheduleInfo from './ScheduleInfo';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import ValidationModal from './ValidationModal';
import './ScheduleDetails.css';

import {
    updateScheduleStatus,
    updateScheduleAssignments,
    exportSchedule,
    toggleEditPosition,
    addPendingChange,
    removePendingChange,
    clearAutofilledStatus,
    applyPendingChanges,
} from '../../model/scheduleSlice';
import {useScheduleValidation} from "../../model/hooks/useScheduleValidation";
import {addNotification} from "../../../../app/model/notificationsSlice";

const ScheduleDetails = ({onCellClick, selectedCell}) => {
    const dispatch = useDispatch();
    const {t} = useI18n();

    const {scheduleDetails, editingPositions, pendingChanges, loading} = useSelector(state => state.schedule);

    // --- Локальное состояние только для UI этого компонента ---
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false); // Для спиннера на кнопке экспорта
    const [exportAlert, setExportAlert] = useState(null); // Для уведомления об экспорте
    const [isSaving, setIsSaving] = useState(false); // Для спиннера на кнопке Save

    // Autofill hooks and state
    const { autofillPosition, autofillAllEditingPositions, isAutofilling, isProcessing } = useScheduleAutofill();
    const { validatePendingChanges } = useScheduleValidation();

    const [validationViolations, setValidationViolations] = useState([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [pendingSavePositionId, setPendingSavePositionId] = useState(null);

    if (!scheduleDetails) {
        return <LoadingState size="lg" message={t('common.loading')}/>;
    }


    // Handle autofill all
    const handleAutofillAll = () => {
        setShowAutofillModal(true);
    };

    const confirmAutofill = async () => {
        await autofillAllEditingPositions(editingPositions);
        setShowAutofillModal(false);
    };

    const handlePositionAutofill = async (position) => {
        console.log('[FILL 2]: handlePositionAutofill', position);
        await autofillPosition(position);
    };

    // --- Обработчики, которые диспатчат экшены Redux ---
    const handleStatusUpdate = async (status) => {
        // .unwrap() помогает обработать результат промиса (успех/ошибка)
        await dispatch(updateScheduleStatus({scheduleId: scheduleDetails.schedule.id, status})).unwrap();
        setShowPublishModal(false);
        setShowUnpublishModal(false);
    };

    // Optimized save without reload
    const handleSaveChanges = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(
            c => c.positionId === positionId && !c.isApplied
        );

        if (positionChanges.length === 0) return;

        // Validate changes
        const violations = validatePendingChanges();
        if (violations.length > 0) {
            setValidationViolations(violations);
            setPendingSavePositionId(positionId);
            setShowValidationModal(true);
            return;
        }

        await performSave(positionId);
    };

    const performSave = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(
            c => c.positionId === positionId && !c.isApplied
        );

        setIsSaving(true);

        try {
            // Send changes to backend
            await dispatch(updateScheduleAssignments({
                scheduleId: scheduleDetails.schedule.id,
                changes: positionChanges
            })).unwrap();

            // Apply changes locally without reload
            dispatch(applyPendingChanges(positionId));

            // Clear autofilled status
            const autofilledKeys = positionChanges
                .filter(c => c.isAutofilled)
                .map((c, idx) => `autofill-${c.positionId}-${c.date}-${c.shiftId}-${c.empId}`);

            if (autofilledKeys.length > 0) {
                dispatch(clearAutofilledStatus(autofilledKeys));
            }

            dispatch(addNotification({
                variant: 'success',
                message: t('schedule.saveSuccess')
            }));

        } catch (error) {
            dispatch(addNotification({
                variant: 'error',
                message: t('schedule.saveFailed')
            }));
        } finally {
            setIsSaving(false);
            setShowValidationModal(false);
            setPendingSavePositionId(null);
        }
    };

    // Block UI during processing
    const isUIBlocked = isProcessing || isAutofilling;

    const handleExport = async (format) => {
        setIsExporting(true);
        setExportAlert(null);
        try {
            const resultAction = await dispatch(exportSchedule({
                scheduleId: scheduleDetails.schedule.id,
                format
            })).unwrap();
            setExportAlert({type: 'success', text: `${t.exportSuccess}: ${resultAction.filename}`});
        } catch (error) {
            setExportAlert({type: 'danger', text: `${t.error}: ${error}`});
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportAlert(null), 5000);
        }
    };

    const handleEmployeeRemove = (date, positionId, shiftId, empId, assignmentId = null) => {
        const key = `remove-${positionId}-${date}-${shiftId}-${empId}`;
        dispatch(addPendingChange({
            key,
            change: {
                action: 'remove',
                positionId,
                date,
                shiftId,
                empId,
                assignmentId
            }
        }));
    };

    const handleEmployeeClick = (date, positionId, shiftId, empId) => {
        const assignment = scheduleDetails?.assignments?.find(a =>
            (a.pos_id === positionId || a.position_id === positionId) &&
            a.emp_id === empId &&
            a.shift_id === shiftId &&
            (a.work_date === date || a.date === date)
        );
        onCellClick(date, positionId, shiftId, empId, assignment?.id);
    };

    const handleRemovePendingChange = (key) => {
        dispatch(removePendingChange(key));
    };

    return (
        <>
            {/* Add overlay when processing */}
            {isUIBlocked && (
                <div className="schedule-processing-overlay">
                    <div className="processing-spinner">
                        <Spinner animation="border" variant="primary" />
                        <p>{t('schedule.processingChanges')}</p>
                    </div>
                </div>
            )}
            <Card className={`mb-3 ${isUIBlocked ? 'disabled-card' : ''}`}>
                <Card.Body>
                    <ScheduleInfo
                        schedule={scheduleDetails.schedule}
                        positions={scheduleDetails.positions}
                        onPublish={() => setShowPublishModal(true)}
                        onUnpublish={() => setShowUnpublishModal(true)}
                        onExport={handleExport}
                        isExporting={isExporting}
                        scheduleDetails={scheduleDetails}
                        onAutofill={handleAutofillAll}
                        isAutofilling={isAutofilling}
                    />

                </Card.Body>
                {exportAlert && (
                    <Alert
                        variant={exportAlert.type}
                        dismissible
                        onClose={() => setExportAlert(null)}
                    >
                        {exportAlert.message}
                    </Alert>
                )}
            </Card>

            <Card className={isUIBlocked ? 'disabled-card' : ''}>
                <Card.Body>
                    {scheduleDetails.positions?.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <ScheduleEditor
                                key={position.pos_id}
                                selectedCell={selectedCell}
                                position={position}
                                schedule={scheduleDetails.schedule}
                                isEditing={!!editingPositions[position.pos_id]}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSaveChanges={() => handleSaveChanges(position.pos_id)}
                                onCancel={() => dispatch(toggleEditPosition(position.pos_id))}
                                onCellClick={onCellClick}
                                scheduleDetails={scheduleDetails}
                                pendingChanges={pendingChanges}
                                isSaving={isSaving}
                                onEmployeeClick={handleEmployeeClick}
                                onEmployeeRemove={handleEmployeeRemove}
                                onRemovePendingChange={handleRemovePendingChange}
                                onAutofill={handlePositionAutofill}
                                isAutofilling={isAutofilling}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon={<i className="bi bi-person-workspace fs-1"></i>}
                            title={t('position.noPositions')}
                            description="This schedule doesn't have any position assignments yet."
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Validation Modal */}
            <ValidationModal
                show={showValidationModal}
                onHide={() => setShowValidationModal(false)}
                onConfirm={() => performSave(pendingSavePositionId)}
                violations={validationViolations}
                title={t('schedule.validationWarning')}
            />

            <ConfirmationModal
                show={showPublishModal}
                onHide={() => setShowPublishModal(false)}
                onConfirm={() => handleStatusUpdate('published')}
                title={t('schedule.publishSchedule')}
                message={t('schedule.confirmPublish')}
                loading={loading === 'pending'}
                confirmText={t('schedule.publish')}
                confirmVariant="success"
            />
            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={() => handleStatusUpdate('draft')}
                title={t('schedule.unpublish')}
                message={t('schedule.confirmUnpublish')}
                variant="warning"
                loading={loading === 'pending'}
                confirmText={t('schedule.unpublish')}
                confirmVariant="warning"
            />
            {/* Autofill confirmation modal */}
            <ConfirmationModal
                show={showAutofillModal}
                onHide={() => setShowAutofillModal(false)}
                onConfirm={confirmAutofill}
                title={t('schedule.autofillSchedule')}
                message={t('schedule.confirmAutofill')}
                loading={isAutofilling}
                confirmText={t('schedule.autofill')}
                confirmVariant="info"
            />
        </>
    );
};

export default ScheduleDetails;