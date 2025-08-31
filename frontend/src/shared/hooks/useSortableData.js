// frontend/src/shared/hooks/useSortableData.js
import { useState, useMemo } from 'react';

/**
 * Hook for sorting array data.
 * @param {Array} items - Original array of elements.
 * @param {Object} [initialConfig] - Initial sorting configuration.
 * @param {Object} [accessors] - Object with accessor functions for getting values for sorting.
 * @returns {{ sortedItems: Array, requestSort: Function, sortConfig: Object }}
 */
export const useSortableData = (items, initialConfig = { field: null, order: 'ASC' }, accessors = {}) => {
    const [sortConfig, setSortConfig] = useState(initialConfig);

    const sortedItems = useMemo(() => {
        if (!items) return [];

        let sortableItems = [...items];

        if (sortConfig.field) {
            // Function to get value. Check if there's a custom accessor for current field.
            const getSortValue = (item) => {
                if (accessors && typeof accessors[sortConfig.field] === 'function') {
                    // If there is one, use it
                    return accessors[sortConfig.field](item);
                }
                // Otherwise, take value by key as before
                return item[sortConfig.field];
            };

            sortableItems.sort((a, b) => {
                const valueA = getSortValue(a);
                const valueB = getSortValue(b);

                // Add null/undefined check for more stable sorting
                if (valueA === null || typeof valueA === 'undefined') return 1;
                if (valueB === null || typeof valueB === 'undefined') return -1;

                // For strings we can add localeCompare for correct sorting in different languages
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortConfig.order === 'ASC'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }

                // Standard comparison for numbers etc.
                if (valueA < valueB) {
                    return sortConfig.order === 'ASC' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortConfig.order === 'ASC' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
        // Add accessors to dependencies so sorting recalculates if they change
    }, [items, sortConfig, accessors]);

    const requestSort = (field) => {
        let newOrder = 'ASC';
        if (sortConfig.field === field && sortConfig.order === 'ASC') {
            newOrder = 'DESC';
        }
        setSortConfig({ field, order: newOrder });
    };

    return { sortedItems, requestSort, sortConfig };
};