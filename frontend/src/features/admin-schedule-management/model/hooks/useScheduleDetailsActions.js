// frontend/src/features/admin-schedule-management/model/hooks/useScheduleDetailsActions.js

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { updateScheduleStatus } from '../scheduleSlice';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import { useScheduleAutofill } from './useScheduleAutofill';

export const useScheduleDetailsActions = (schedule) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { editingPositions } = useSelector(state => state.schedule);
    const { autofillAllEditingPositions, isAutofilling } = useScheduleAutofill();

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
        renderModals
    };
};