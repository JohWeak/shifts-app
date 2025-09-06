// frontend/src/shared/hooks/useStableRef.js
import { useCallback, useRef } from 'react';

// Hook to create stable function references
export const useStableCallback = (callback) => {
    const callbackRef = useRef(callback);

    // Update ref with latest callback
    callbackRef.current = callback;

    // Return stable callback that always calls the latest version
    return useCallback((...args) => {
        return callbackRef.current?.(...args);
    }, []);
};

// Hook to create stable value references
export const useStableValue = (value) => {
    const valueRef = useRef(value);
    const stableValueRef = useRef(value);

    // Only update stable value if it actually changed (deep comparison for objects)
    if (valueRef.current !== value) {
        if (typeof value === 'object' && value !== null) {
            // Simple shallow comparison for objects
            const prevKeys = Object.keys(valueRef.current || {});
            const currKeys = Object.keys(value || {});

            let hasChanged = prevKeys.length !== currKeys.length;

            if (!hasChanged) {
                hasChanged = prevKeys.some(key => valueRef.current[key] !== value[key]);
            }

            if (hasChanged) {
                stableValueRef.current = value;
            }
        } else {
            stableValueRef.current = value;
        }

        valueRef.current = value;
    }

    return stableValueRef.current;
};