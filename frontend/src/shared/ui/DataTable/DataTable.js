// frontend/src/shared/ui/DataTable/DataTable.js
import React from 'react';
import { Table, Spinner } from 'react-bootstrap';
import { EmptyState } from '../EmptyState/EmptyState';
import './DataTable.css';

export const DataTable = ({
                              columns,
                              data,
                              loading,
                              emptyState,
                              responsive = true,
                              hover = true
                          }) => {
    if (loading) {
        return (
            <div className="data-table-loading">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <EmptyState {...emptyState} />;
    }

    return (
        <Table responsive={responsive} hover={hover} className="data-table">
            <thead>
            <tr>
                {columns.map((column, index) => (
                    <th key={index} style={column.style}>
                        {column.header}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    {columns.map((column, colIndex) => (
                        <td key={colIndex}>
                            {column.render ? column.render(row) : row[column.accessor]}
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </Table>
    );
};