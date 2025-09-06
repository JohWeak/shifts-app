// frontend/src/shared/hooks/useRequestTimeout.js
import { useCallback, useRef } from 'react';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const LONG_TIMEOUT = 60000; // 60 seconds

export const useRequestTimeout = () => {
    const activeRequests = useRef(new Map());

    const createTimeoutWrapper = useCallback((asyncFunction, timeout = DEFAULT_TIMEOUT, requestId) => {
        return async (...args) => {
            const id = requestId || `req_${Date.now()}_${Math.random()}`;

            // Cancel previous request with same ID if it exists
            if (activeRequests.current.has(id)) {
                const { controller } = activeRequests.current.get(id);
                controller.abort();
                activeRequests.current.delete(id);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error(`[RequestTimeout] Request ${id} timed out after ${timeout}ms`);
            }, timeout);

            activeRequests.current.set(id, { controller, timeoutId });

            try {
                // Add abort signal to the request if it's an API call
                const result = await asyncFunction(...args, { signal: controller.signal });

                clearTimeout(timeoutId);
                activeRequests.current.delete(id);

                return result;
            } catch (error) {
                clearTimeout(timeoutId);
                activeRequests.current.delete(id);

                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${timeout}ms`);
                }
                throw error;
            }
        };
    }, []);

    const cancelRequest = useCallback((requestId) => {
        if (activeRequests.current.has(requestId)) {
            const { controller, timeoutId } = activeRequests.current.get(requestId);
            controller.abort();
            clearTimeout(timeoutId);
            activeRequests.current.delete(requestId);
        }
    }, []);

    const cancelAllRequests = useCallback(() => {
        activeRequests.current.forEach(({ controller, timeoutId }) => {
            controller.abort();
            clearTimeout(timeoutId);
        });
        activeRequests.current.clear();
    }, []);

    return {
        withTimeout: createTimeoutWrapper,
        withShortTimeout: (fn, requestId) => createTimeoutWrapper(fn, DEFAULT_TIMEOUT, requestId),
        withLongTimeout: (fn, requestId) => createTimeoutWrapper(fn, LONG_TIMEOUT, requestId),
        cancelRequest,
        cancelAllRequests,
        activeRequestsCount: activeRequests.current.size,
    };
};