// frontend/src/shared/hooks/useThrottledEffect.js
import { useCallback, useEffect, useRef } from 'react';

export const useThrottledEffect = (effect, deps, delay = 100) => {
    const lastRun = useRef(Date.now());
    const timeoutRef = useRef();

    const throttledEffect = useCallback(() => {
        const now = Date.now();

        if (now - lastRun.current >= delay) {
            // Execute immediately if enough time has passed
            lastRun.current = now;
            effect();
        } else {
            // Schedule execution for later
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                lastRun.current = Date.now();
                effect();
            }, delay - (now - lastRun.current));
        }
    }, [effect, delay]);

    useEffect(throttledEffect, deps);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
};