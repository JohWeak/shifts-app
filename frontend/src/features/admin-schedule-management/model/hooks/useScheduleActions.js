// frontend/src/features/admin-schedule-management/model/hooks/useScheduleActions.js

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    generateSchedule,
    deleteSchedule,
    updateScheduleStatus,
    exportSchedule,
    fetchScheduleDetails,
    updateScheduleAssignments,
    clearAutofilledStatus,
    applyPendingChanges
} from '../scheduleSlice';
import { addNotification } from 'app/model/notificationsSlice';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useScheduleAutofill } from './useScheduleAutofill';
import { useScheduleValidation } from './useScheduleValidation';
import ConfirmationModal from "../../../../shared/ui/components/ConfirmationModal/ConfirmationModal";
import {formatWeekRange} from "../../../../shared/lib/utils/scheduleUtils";

export const useScheduleActions = (schedule = null) => {
    const dispatch = useDispatch();
    const { t, locale } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // For detail actions
    const { editingPositions, scheduleDetails, pendingChanges } = useSelector(state => state.schedule);
    const { autofillAllEditingPositions, isAutofilling } = useScheduleAutofill();
    const { validatePositionChanges } = useScheduleValidation();


    const [scheduleToPublish, setScheduleToPublish] = useState(null);
    const [scheduleToUnpublish, setScheduleToUnpublish] = useState(null);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [validationViolations, setValidationViolations] = useState([]);
    const [pendingSavePositionId, setPendingSavePositionId] = useState(null);

    // Modal states
    const [showAutofillModal, setShowAutofillModal] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);

    const [isUpdating, setIsUpdating] = useState(false);

    // Generic action handler
    const handleAction = useCallback(async (
        actionName,
        actionThunk,
        successMessage,
        errorMessage,
        options = {}
    ) => {
        setLoading(true);
        setError(null);

        try {
            const result = await dispatch(actionThunk).unwrap();

            if (!options.skipNotification && successMessage) {
                dispatch(addNotification({
                    variant: 'success',
                    message: successMessage,
                    params: options.messageParams,
                    duration: options.successDuration || 5000
                }));
            }

            if (options.onSuccess) {
                await options.onSuccess(result);
            }

            return { success: true, data: result };

        } catch (err) {
            const errorMsg = err?.message || err || errorMessage || t('errors.genericError');

            if (errorMsg.includes('PUBLISHED_SCHEDULE_EXISTS')) {
                dispatch(addNotification({
                    variant: 'warning',
                    message: 'schedule.publishedScheduleExists',
                    duration: 8000
                }));
                setError(t('schedule.publishedScheduleExists'));
            } else if (!options.skipNotification) {
                dispatch(addNotification({
                    variant: 'error',
                    message: errorMsg,
                    duration: options.errorDuration || 5000
                }));
                setError(errorMsg);
            }

            if (options.onError) {
                await options.onError(err);
            }

            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, [dispatch, t]);

    // Schedule list actions
    const handleGenerate = useCallback((settings) =>
        handleAction(
            'generate',
            generateSchedule(settings),
            'schedule.generationSuccess',
            'errors.generateFailed'
        ), [handleAction]);


    const handleExport = useCallback((scheduleId, format) =>
        handleAction(
            'export',
            exportSchedule({ scheduleId, format }),
            'schedule.exportSuccess',
            'errors.exportFailed'
        ), [handleAction]);

    // Schedule detail actions with modals
    const handlePublish = useCallback(async () => {
        if (!scheduleToPublish?.id) return;

        setIsUpdating(true);
        await handleAction(
            'publish',
            updateScheduleStatus({ scheduleId: scheduleToPublish.id, status: 'published' }),
            'schedule.publishSuccess',
            'errors.publishFailed',
            {
                onSuccess: () => {
                    if (schedule) dispatch(fetchScheduleDetails(schedule.id));
                    setScheduleToPublish(null);
                }
            }
        );
        setIsUpdating(false);
    }, [scheduleToPublish, handleAction, dispatch, schedule]);

    const handleUnpublish = useCallback(async () => {
        if (!scheduleToUnpublish?.id) return;

        setIsUpdating(true);
        await handleAction(
            'unpublish',
            updateScheduleStatus({ scheduleId: scheduleToUnpublish.id, status: 'draft' }),
            'schedule.unpublishSuccess',
            'errors.unpublishFailed',
            {
                onSuccess: () => {
                    if (schedule) dispatch(fetchScheduleDetails(schedule.id));
                    setScheduleToUnpublish(null);
                }
            }
        );
        setIsUpdating(false);
    }, [scheduleToUnpublish, handleAction, dispatch, schedule]);

    const handleDelete = useCallback(async () => {
        if (!scheduleToDelete?.schedule?.id) return;

        setIsUpdating(true);
        await handleAction(
            'delete',
            deleteSchedule(scheduleToDelete.schedule.id),
            'schedule.deleteSuccess',
            'errors.deleteFailed',
            {
                onSuccess: () => {
                    // Вызываем колбэк, который мы сохранили в promptDelete
                    if (scheduleToDelete.onSuccess) {
                        scheduleToDelete.onSuccess();
                    }
                    setScheduleToDelete(null); // Закрываем модальное окно
                }
            }
        );
        setIsUpdating(false);
    }, [scheduleToDelete, handleAction, dispatch]);

    const handleAutofill = useCallback(async () => {
        try {
            await autofillAllEditingPositions(editingPositions);
            setShowAutofillModal(false);
            dispatch(addNotification({
                variant: 'success',
                message: 'schedule.autofillSuccess',
                duration: 5000
            }));
        } catch (error) {
            dispatch(addNotification({
                variant: 'error',
                message: 'schedule.autofillFailed',
                duration: 5000
            }));
        }
    }, [autofillAllEditingPositions, editingPositions, dispatch]);

    // Position save with validation
    const handleSavePosition = useCallback(async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(
            c => c.positionId === positionId && !c.isApplied
        );

        if (positionChanges.length === 0) {
            return { success: true, noChanges: true };
        }

        try {
            const violations = await validatePositionChanges(positionId);

            if (violations.length > 0) {
                setValidationViolations(violations);
                setPendingSavePositionId(positionId);
                setShowValidationModal(true);
                return { showValidation: true, violations };
            }

            return await performSave(positionId);
        } catch (error) {
            dispatch(addNotification({
                variant: 'error',
                message: 'schedule.saveFailed',
                duration: 5000
            }));
            return { success: false, error };
        }
    }, [pendingChanges, validatePositionChanges, dispatch]);

    const performSave = useCallback(async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(
            c => c.positionId === positionId && !c.isApplied
        );

        const result = await handleAction(
            'save',
            updateScheduleAssignments({
                scheduleId: scheduleDetails.schedule.id,
                changes: positionChanges
            }),
            'schedule.saveSuccess',
            'errors.saveFailed',
            {
                onSuccess: () => {
                    dispatch(applyPendingChanges(positionId));
                    setShowValidationModal(false);
                    setPendingSavePositionId(null);

                    // Clear autofilled status
                    const autofilledKeys = positionChanges
                        .filter(c => c.isAutofilled)
                        .map(c => `autofill-${c.positionId}-${c.date}-${c.shiftId}-${c.empId}`);

                    if (autofilledKeys.length > 0) {
                        dispatch(clearAutofilledStatus(autofilledKeys));
                    }
                }
            }
        );

        return result;
    }, [pendingChanges, scheduleDetails, handleAction, dispatch]);

    const confirmSaveWithViolations = useCallback(async () => {
        if (pendingSavePositionId) {
            return await performSave(pendingSavePositionId);
        }
    }, [pendingSavePositionId, performSave]);

    const promptPublish = (scheduleOverride) => {
        const target = scheduleOverride || schedule;
        if (target) setScheduleToPublish(target);
    };

    const promptUnpublish = (scheduleOverride) => {
        const target = scheduleOverride || schedule;
        console.log('target:', target);
        if (target) setScheduleToUnpublish(target);
    };

    const promptDelete = (scheduleOverride, options = {}) => {
        const target = scheduleOverride || schedule;
        if (target) {
            setScheduleToDelete({ schedule: target, onSuccess: options.onSuccess });
        }
    };


    const renderModals = () => (
        <>
            <ConfirmationModal
                show={!!scheduleToPublish}
                onHide={() => setScheduleToPublish(null)}
                onConfirm={() => handlePublish()}
                title={t('schedule.publishSchedule')}
                message={t('schedule.confirmPublish')}
                loading={isUpdating}
                confirmText={t('schedule.publish')}
                confirmVariant="success"
            />
            <ConfirmationModal
                show={!!scheduleToUnpublish}
                onHide={() => setScheduleToUnpublish(null)}
                onConfirm={() => handleUnpublish()}
                title={t('schedule.unpublish')}
                message={t('schedule.confirmUnpublish')}
                loading={isUpdating}
                confirmText={t('schedule.unpublish')}
                confirmVariant="warning"
            />
            <ConfirmationModal
                show={showAutofillModal}
                onHide={() => setShowAutofillModal(false)}
                onConfirm={handleAutofill}
                title={t('schedule.autofillSchedule')}
                message={t('schedule.confirmAutofill')}
                loading={isAutofilling}
                confirmText={t('schedule.autofill')}
                confirmVariant="info"
            />
            <ConfirmationModal
                show={!!scheduleToDelete}
                title={t('schedule.deleteSchedule')}
                message={t('schedule.confirmDelete')}
                onConfirm={handleDelete}
                onHide={() => setScheduleToDelete(null)}
                loading={loading}
                confirmText={t('schedule.deleteSchedule')}
                variant="danger">
                {scheduleToDelete &&
                    <div className="schedule-info bg-danger bg-opacity-10 p-3 rounded">
                        <p>
                            <strong>{t('schedule.weekPeriod')}:</strong>
                            {formatWeekRange(scheduleToDelete.start_date, locale)}
                        </p>
                        <p>
                            <strong>{t('schedule.site')}:</strong>
                            {scheduleToDelete.workSite?.site_name || 'N/A'}
                        </p>
                    </div>
                }
            </ConfirmationModal>
        </>
    );

    return {
        // State
        loading,
        error,
        isAutofilling,

        // Modal states
        showAutofillModal,
        setShowAutofillModal,
        showValidationModal,
        setShowValidationModal,
        validationViolations,


        // Actions
        handleGenerate,
        handleDelete,
        handleExport,
        handlePublish,
        handleUnpublish,
        handleAutofill,
        handleSavePosition,
        confirmSaveWithViolations,

        // Modal triggers
        renderModals,
        promptPublish,
        promptUnpublish,
        promptAutofill: () => setShowAutofillModal(true),
        promptDelete,
    };
};