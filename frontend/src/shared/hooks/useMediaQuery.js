// src/shared/lib/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        const listener = () => setMatches(media.matches);

        // Старый Safari может не поддерживать addEventListener
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else {
            media.addListener(listener); // для обратной совместимости
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query]);

    return matches;
};