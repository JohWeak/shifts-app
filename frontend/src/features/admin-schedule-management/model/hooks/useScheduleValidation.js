// frontend/src/features/admin-schedule-management/model/hooks/useScheduleValidation.js
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { scheduleAPI } from 'shared/api/apiService';

export const useScheduleValidation = () => {
    const { t } = useI18n();
    const { scheduleDetails, pendingChanges } = useSelector(state => state.schedule);

    /**
     * Validate pending changes using backend service
     */
    const validatePendingChanges = useCallback(async () => {
        if (!scheduleDetails?.schedule?.id) {
            return [];
        }

        try {
            // Filter only non-applied changes
            const changes = Object.values(pendingChanges).filter(c => !c.isApplied);

            if (changes.length === 0) {
                return [];
            }
            const scheduleId = scheduleDetails.schedule.id;
            const response = await scheduleAPI.validateSchedule(scheduleId);

            return response.data.violations || [];

        } catch (error) {
            console.error('Validation failed:', error);
            // Log full error for debugging
            if (error.response) {
                console.error('Response error:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            // Return empty array on error to not block saving
            return [];
        }
    }, [pendingChanges, scheduleDetails?.schedule?.id]);

    return {
        validatePendingChanges
    };
};