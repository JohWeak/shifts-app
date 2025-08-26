// frontend/src/app/model/notificationsSlice.js
import {createSlice, nanoid} from '@reduxjs/toolkit';

const initialState = {
    notifications: [],
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        // Action to add a new notification
        addNotification: {
            reducer: (state, action) => {
                state.notifications.push(action.payload);
            },
            prepare: ({id, message, variant = 'success', duration = 3000}) => {
                const finalId = id || nanoid();
                // Adding updateCount during creation
                return {payload: {id: finalId, message, variant, duration, updateCount: 0}};
            },
        },
        // Action to delete a notification (usually by ID)
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== action.payload
            );
        },
        updateNotification: (state, action) => {
            const {id, ...updates} = action.payload;
            const notification = state.notifications.find(n => n.id === id);
            if (notification) {
                Object.assign(notification, updates);
                // Adding or incrementing the update counter
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