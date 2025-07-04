// frontend/src/app/model/notificationsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
    notifications: [],
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        // Экшен для добавления нового уведомления
        addNotification: {
            reducer: (state, action) => {
                state.notifications.push(action.payload);
            },
            prepare: ({ id, message, variant = 'success', duration = 3000 }) => {
                const finalId = id || nanoid();
                // Добавляем updateCount при создании
                return { payload: { id: finalId, message, variant, duration, updateCount: 0 } };
            },
        },
        // Экшен для удаления уведомления (обычно по ID)
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== action.payload
            );
        },
        updateNotification: (state, action) => {
            const { id, ...updates } = action.payload;
            const notification = state.notifications.find(n => n.id === id);
            if (notification) {
                Object.assign(notification, updates);
                // Добавляем или увеличиваем счетчик обновлений
                notification.updateCount = (notification.updateCount || 0) + 1;
            }
        },
    },
});

export const {
    addNotification,
    removeNotification,
    updateNotification
} = notificationsSlice.actions;
export default notificationsSlice.reducer;