// frontend/src/shared/ui/components/SortableHeader/SortableHeader.js
import React from 'react';
import './SortableHeader.css'; // Создадим этот файл для стилей

const SortableHeader = ({ children, sortKey, sortConfig, onSort, ...thProps }) => {
    const getSortIcon = () => {
        if (sortConfig.field !== sortKey) {
            return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
        }
        return sortConfig.order === 'ASC'
            ? <i className="bi bi-arrow-up ms-1"></i>
            : <i className="bi bi-arrow-down ms-1"></i>;
    };

    return (
        <th
            className="sortable-header"
            onClick={() => onSort(sortKey)}
            {...thProps}
        >
            {children}
            {getSortIcon()}
        </th>
    );
};

export default SortableHeader;