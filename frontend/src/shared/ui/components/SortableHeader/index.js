// frontend/src/shared/ui/components/SortableHeader/index.js
import React from 'react';
import './SortableHeader.css';

const SortableHeader = ({ children, sortKey, sortConfig, onSort, ...thProps }) => {

    const isSortable = !!onSort;
    const isSorted = isSortable && sortConfig?.field === sortKey;

    const getIconClass = () => {
        if (!isSorted) {
            return 'bi-arrow-down-up';
        }
        return sortConfig.order === 'ASC' ? 'bi-arrow-up' : 'bi-arrow-down';
    };
    const handleClick = () => {
        if (isSortable) {
            onSort(sortKey);
        }
    };
    const headerClasses = [
        'sortable-header',
        isSortable ? 'is-sortable' : '',
        isSorted ? 'sorted' : '',
    ].join(' ').trim();

    return (
        <th
            className={headerClasses}
            onClick={handleClick}
            {...thProps}
        >
            <div className="header-content">
                <span>{children}</span>
                {isSortable &&
                    <i className={`bi ${getIconClass()} sort-icon`}></i>
                }
            </div>
        </th>
    );
};

export default SortableHeader;