// frontend/src/features/admin-schedule-management/model/hooks/useEmployeeHighlight.js
import { useState, useCallback, useEffect } from 'react';

export const useEmployeeHighlight = () => {
    const [highlightedEmployeeId, setHighlightedEmployeeId] = useState(null);

    const handleMouseEnter = useCallback((empId) => {
        setHighlightedEmployeeId(empId);

        // Add highlight class to all employee containers with same ID
        document.querySelectorAll(`[data-employee-id="${empId}"]`).forEach(el => {
            el.classList.add('employee-highlighted');
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (highlightedEmployeeId) {
            document.querySelectorAll(`[data-employee-id="${highlightedEmployeeId}"]`).forEach(el => {
                el.classList.remove('employee-highlighted');
            });
        }
        setHighlightedEmployeeId(null);
    }, [highlightedEmployeeId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.querySelectorAll('.employee-highlighted').forEach(el => {
                el.classList.remove('employee-highlighted');
            });
        };
    }, []);

    return {
        highlightedEmployeeId,
        handleMouseEnter,
        handleMouseLeave
    };
};