// frontend/src/shared/lib/cache/cacheUtils.js

export const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000,      // 5 минут
    MEDIUM: 15 * 60 * 1000,    // 15 минут
    LONG: 30 * 60 * 1000,      // 30 минут
    EXTRA_LONG: 60 * 60 * 1000, // 1 час
};

export const isCacheValid = (timestamp, duration = CACHE_DURATION.MEDIUM) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < duration;
};

export const getCacheEntry = (cache, key) => {
    return cache[key] || null;
};

export const setCacheEntry = (cache, key, data) => {
    cache[key] = {
        data,
        timestamp: Date.now()
    };
};

export const isCacheEntryValid = (cacheEntry, duration = CACHE_DURATION.MEDIUM) => {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < duration;
};

export const clearCacheEntry = (cache, key) => {
    if (key) {
        delete cache[key];
    } else {
        // Clear all entries
        Object.keys(cache).forEach(k => delete cache[k]);
    }
};