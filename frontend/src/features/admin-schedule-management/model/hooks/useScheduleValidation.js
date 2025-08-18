// frontend/src/features/admin-schedule-management/model/hooks/useScheduleValidation.js
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { scheduleAPI } from 'shared/api/apiService';

export const useScheduleValidation = () => {
    const { t } = useI18n();
    const { scheduleDetails, pendingChanges } = useSelector(state => state.schedule);

    /**
     * Validate pending changes for a specific position
     */
    const validatePositionChanges = useCallback(async (positionId) => {
        if (!scheduleDetails?.schedule?.id) {
            console.log('No schedule details for validation');
            return [];
        }

        try {
            // Filter changes for specific position only
            const positionChanges = Object.values(pendingChanges).filter(
                c => c.positionId === positionId && !c.isApplied
            );

            if (positionChanges.length === 0) {
                console.log('No changes to validate for position:', positionId);
                return [];
            }

            console.log('Validating changes for position:', positionId, positionChanges);

            const response = await scheduleAPI.validateScheduleChanges(
                scheduleDetails.schedule.id,
                positionChanges
            );

            console.log('Validation response:', response);
            return response.violations || [];

        } catch (error) {
            console.error('Validation failed:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            // Return empty array on error to not block saving
            return [];
        }
    }, [pendingChanges, scheduleDetails]);

    /**
     * Validate all pending changes (for global save)
     */
    const validateAllPendingChanges = useCallback(async () => {
        if (!scheduleDetails?.schedule?.id) {
            return [];
        }

        try {
            const changes = Object.values(pendingChanges).filter(c => !c.isApplied);

            if (changes.length === 0) {
                return [];
            }

            const response = await scheduleAPI.validateScheduleChanges(
                scheduleDetails.schedule.id,
                changes
            );

            return response.violations || [];

        } catch (error) {
            console.error('Validation failed:', error);
            return [];
        }
    }, [pendingChanges, scheduleDetails]);

    return {
        validatePositionChanges,
        validateAllPendingChanges
    };
};