// frontend/src/features/admin-schedule-management/model/hooks/useScheduleDetailsActions.js

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {applyPendingChanges, updateScheduleAssignments, updateScheduleStatus} from '../scheduleSlice';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import { useScheduleAutofill } from './useScheduleAutofill';
import { useScheduleValidation } from './useScheduleValidation';
import {addNotification} from "../../../../app/model/notificationsSlice";

export const useScheduleDetailsActions = (schedule) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { editingPositions } = useSelector(state => state.schedule);
    const { autofillAllEditingPositions, isAutofilling } = useScheduleAutofill();
    const { scheduleDetails, pendingChanges } = useSelector(state => state.schedule);
    const { validatePositionChanges } = useScheduleValidation();

    const [validationViolations, setValidationViolations] = useState([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [pendingSavePositionId, setPendingSavePositionId] = useState(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [showAutofillModal, setShowAutofillModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async (status) => {
        setIsUpdating(true);
        try {
            await dispatch(updateScheduleStatus({ scheduleId: schedule.id, status })).unwrap();
            setShowPublishModal(false);
            setShowUnpublishModal(false);
        } catch (e) {
            console.error("Failed to update status:", e);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAutofillConfirm = async () => {
        await autofillAllEditingPositions(editingPositions);
        setShowAutofillModal(false);
    };

    const handleSavePosition = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(
            c => c.positionId === positionId && !c.isApplied
        );

        if (positionChanges.length === 0) return;

        try {
            // Validate changes for this position only
            console.log('Validating position changes...');
            const violations = await validatePositionChanges(positionId);
            console.log('Validation violations:', violations);

            if (violations.length > 0) {
                setValidationViolations(violations);
                setPendingSavePositionId(positionId);
                setShowValidationModal(true);
                return { showValidation: true, violations };
            }

            // No violations, proceed with save
            return await performSave(positionId);

        } catch (error) {
            console.error('Save/validation failed:', error);
            dispatch(addNotification({
                variant: 'error',
                message: t('schedule.saveFailed')
            }));
            return { success: false, error };
        }
    };

    const performSave = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(
            c => c.positionId === positionId && !c.isApplied
        );

        try {
            await dispatch(updateScheduleAssignments({
                scheduleId: scheduleDetails.schedule.id,
                changes: positionChanges
            })).unwrap();

            // Apply changes locally without reload
            dispatch(applyPendingChanges(positionId));

            dispatch(addNotification({
                variant: 'success',
                message: t('schedule.saveSuccess')
            }));

            setShowValidationModal(false);
            setPendingSavePositionId(null);

            return { success: true };

        } catch (error) {
            console.error('Save failed:', error);
            return { success: false, error };
        }
    };

    const confirmSaveWithViolations = async () => {
        if (pendingSavePositionId) {
            return await performSave(pendingSavePositionId);
        }
    };

    const renderModals = () => (
        <>
            <ConfirmationModal
                show={showPublishModal}
                onHide={() => setShowPublishModal(false)}
                onConfirm={() => handleStatusUpdate('published')}
                title={t('schedule.publishSchedule')}
                message={t('schedule.confirmPublish')}
                loading={isUpdating}
                confirmText={t('schedule.publish')}
                confirmVariant="success"
            />
            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={() => handleStatusUpdate('draft')}
                title={t('schedule.unpublish')}
                message={t('schedule.confirmUnpublish')}
                loading={isUpdating}
                confirmText={t('schedule.unpublish')}
                confirmVariant="warning"
            />
            <ConfirmationModal
                show={showAutofillModal}
                onHide={() => setShowAutofillModal(false)}
                onConfirm={handleAutofillConfirm}
                title={t('schedule.autofillSchedule')}
                message={t('schedule.confirmAutofill')}
                loading={isAutofilling}
                confirmText={t('schedule.autofill')}
                confirmVariant="info"
            />
        </>
    );

    return {
        promptPublish: () => setShowPublishModal(true),
        promptUnpublish: () => setShowUnpublishModal(true),
        promptAutofill: () => setShowAutofillModal(true),
        isAutofilling,
        renderModals,
        handleSavePosition,
        performSave,
        confirmSaveWithViolations,
        validationViolations,
        showValidationModal,
        setShowValidationModal,
        pendingSavePositionId
    };
};