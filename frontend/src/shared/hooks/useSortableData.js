// frontend/src/shared/hooks/useSortableData.js
import { useState, useMemo } from 'react';

/**
 * Хук для сортировки массива данных.
 * @param {Array} items - Исходный массив элементов.
 * @param {Object} [initialConfig] - Начальная конфигурация сортировки.
 * @param {Object} [accessors] - Объект с функциями-аксессорами для получения значений для сортировки.
 * @returns {{ sortedItems: Array, requestSort: Function, sortConfig: Object }}
 */
export const useSortableData = (items, initialConfig = { field: null, order: 'ASC' }, accessors = {}) => {
    const [sortConfig, setSortConfig] = useState(initialConfig);

    const sortedItems = useMemo(() => {
        if (!items) return [];

        let sortableItems = [...items];

        if (sortConfig.field) {
            // Функция для получения значения. Проверяем, есть ли для текущего поля кастомный аксессор.
            const getSortValue = (item) => {
                if (accessors && typeof accessors[sortConfig.field] === 'function') {
                    // Если есть, используем его
                    return accessors[sortConfig.field](item);
                }
                // Иначе, берем значение по ключу, как и раньше
                return item[sortConfig.field];
            };

            sortableItems.sort((a, b) => {
                const valueA = getSortValue(a);
                const valueB = getSortValue(b);

                // Добавим проверку на null/undefined для более стабильной сортировки
                if (valueA === null || typeof valueA === 'undefined') return 1;
                if (valueB === null || typeof valueB === 'undefined') return -1;

                // Для строк можно добавить localeCompare для корректной сортировки на разных языках
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortConfig.order === 'ASC'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }

                // Стандартное сравнение для чисел и др.
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
        // Добавляем accessors в зависимости, чтобы сортировка пересчиталась, если они изменятся
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