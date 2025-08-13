// frontend/src/features/admin-schedule-management/ui/schedule-table/DraggableEmployee.js
import React from 'react';

const DraggableEmployee = ({
                               employee,
                               isEditMode,
                               onDragStart,
                               onDragEnd,
                               onMouseEnter,
                               onMouseLeave,
                               isHighlighted,
                               cellData,
                               className = '',
                               renderContent
                           }) => {
    return (
        <div
            className={`draggable-employee ${className} ${isHighlighted ? 'employee-highlighted' : ''}`}
            data-employee-id={employee.empId}
            data-employee-data={JSON.stringify(employee)}
            draggable={isEditMode}
            onDragStart={(e) => isEditMode && onDragStart && onDragStart(e, employee, cellData)}
            onDragEnd={(e) => isEditMode && onDragEnd && onDragEnd(e)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDragOver={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onDrop={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}

        >
            {renderContent ? renderContent() : (
                <span className="employee-name">
                    {employee.name}
                </span>
            )}
        </div>
    );
};

export default DraggableEmployee;