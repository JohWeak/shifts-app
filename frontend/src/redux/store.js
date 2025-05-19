import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authReducer';

// Create store with built-in middleware (including thunk)
const store = configureStore({
    reducer: {
        auth: authReducer,
        // Add other reducers here as your app grows
    }
});

export default store;