// frontend/src/shared/ui/components/SortableHeader/SortableHeader.js
import React from 'react';
import './SortableHeader.css';

const SortableHeader = ({ children, sortKey, sortConfig, onSort, ...thProps }) => {
    const isSorted = sortConfig.field === sortKey;

    const getIconClass = () => {
        if (!isSorted) {
            return 'bi-arrow-down-up';
        }
        return sortConfig.order === 'ASC' ? 'bi-arrow-up' : 'bi-arrow-down';
    };

    return (
        <th
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