// frontend/src/shared/lib/cache/cacheUtils.js
export const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000,      // 5 минут
    MEDIUM: 15 * 60 * 1000,    // 15 минут
    LONG: 60 * 60 * 1000,      // 1 час
};

export const isCacheValid = (timestamp, duration = CACHE_DURATION.MEDIUM) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
};