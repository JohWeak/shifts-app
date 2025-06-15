// frontend/src/features/schedule-management/hooks/useScheduleActions.js
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import {
    generateSchedule,
    deleteSchedule,
    updateScheduleStatus,
    exportSchedule
} from '../../../app/store/slices/scheduleSlice';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';

export const useScheduleActions = () => {
    const dispatch = useDispatch();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async (settings) => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(generateSchedule(settings)).unwrap();
            return { success: true };
        } catch (err) {
            setError(err.message || t('errors.generateFailed'));
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (scheduleId) => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(deleteSchedule(scheduleId)).unwrap();
            return { success: true };
        } catch (err) {
            setError(err.message || t('errors.deleteFailed'));
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (scheduleId, status) => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(updateScheduleStatus({ scheduleId, status })).unwrap();
            return { success: true };
        } catch (err) {
            setError(err.message || t('errors.updateFailed'));
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (scheduleId, format) => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(exportSchedule({ scheduleId, format })).unwrap();
            return { success: true };
        } catch (err) {
            setError(err.message || t('errors.exportFailed'));
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        handleGenerate,
        handleDelete,
        handleStatusUpdate,
        handleExport
    };
};