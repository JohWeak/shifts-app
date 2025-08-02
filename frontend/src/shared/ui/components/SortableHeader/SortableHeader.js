// frontend/src/shared/ui/components/SortableHeader/SortableHeader.js
import React from 'react';
import './SortableHeader.css';

const SortableHeader = ({ children, sortKey, sortConfig, onSort, ...thProps }) => {
    // Определяем, активна ли сортировка для этой колонки
    const isSorted = sortConfig.field === sortKey;

    // Упрощаем логику выбора иконки
    const getIconClass = () => {
        if (!isSorted) {
            return 'bi-arrow-down-up'; // Иконка для несортированных колонок
        }
        return sortConfig.order === 'ASC' ? 'bi-arrow-up' : 'bi-arrow-down';
    };

    return (
        <th
            // Добавляем класс 'sorted', если колонка отсортирована
            className={`sortable-header ${isSorted ? 'sorted' : ''}`}
            onClick={() => onSort(sortKey)}
            {...thProps}
        >
            <div className="header-content">
                <span>{children}</span>
                <i className={`bi ${getIconClass()} sort-icon`}></i>
            </div>
        </th>
    );
};

export default SortableHeader;