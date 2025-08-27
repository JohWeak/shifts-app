// frontend/src/features/admin-workplace-settings/model/hooks/useWorkplaceActionHandler.js
import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {nanoid} from '@reduxjs/toolkit';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {addNotification, updateNotification} from 'app/model/notificationsSlice';

export const useWorkplaceActionHandler = ({
                                              actionThunk,
                                              refetchThunk,
                                              messages,
                                              getSuccessMessage
                                          }) => {
    const dispatch = useDispatch();
    const {t} = useI18n();
    const [isLoading, setIsLoading] = useState(false);

    const execute = async (item) => {
        if (!item) return;

        setIsLoading(true);
        const notificationId = nanoid();

        dispatch(addNotification({
            id: notificationId,
            message: t(messages.processing),
            variant: 'info',
            duration: null
        }));

        try {
            const result = await dispatch(actionThunk(item.id)).unwrap();

            const successMessage = getSuccessMessage
                ? getSuccessMessage(result, t)
                : t(messages.success);

            dispatch(updateNotification({
                id: notificationId,
                message: successMessage,
                variant: 'success',
                duration: 4000
            }));

            dispatch(refetchThunk());

        } catch (error) {
            dispatch(updateNotification({
                id: notificationId,
                message: error.message || t(messages.error),
                variant: 'danger',
                duration: 5000
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return {execute, isLoading};
};