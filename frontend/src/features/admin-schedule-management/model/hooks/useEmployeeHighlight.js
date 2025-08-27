import { useState, useCallback } from 'react';

export const useEmployeeHighlight = () => {
    const [highlightedEmployeeId, setHighlightedEmployeeId] = useState(null);

    // useCallback здесь для стабильности ссылок на функции
    const handleMouseEnter = useCallback((empId) => {
        setHighlightedEmployeeId(empId);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHighlightedEmployeeId(null);
    }, []);

    return {
        highlightedEmployeeId,
        handleMouseEnter,
        handleMouseLeave
    };
};