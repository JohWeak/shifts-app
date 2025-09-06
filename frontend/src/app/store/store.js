import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { actionProtectionMiddleware } from '../../shared/middleware/actionProtectionMiddleware';

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }).concat(actionProtectionMiddleware),
});

export default store;