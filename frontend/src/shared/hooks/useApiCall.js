import { useState, useCallback } from 'react';
import { useI18n } from '../lib/i18n/i18nProvider';

export const useApiCall = () => {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (apiCall, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiCall();
            if (options.onSuccess) {
                options.onSuccess(result);
            }
            return { success: true, data: result };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || t('errors.unexpectedError');
            setError(errorMessage);

            if (options.onError) {
                options.onError(errorMessage);
            }

            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [t]);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    return { loading, error, execute, reset };
};