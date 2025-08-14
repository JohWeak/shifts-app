// frontend/src/features/admin-schedule-management/ui/schedule-table/DraggableEmployee.js
import React from 'react';
import './DraggableEmployee.css';

const DraggableEmployee = ({
                               employee,
                               isEditMode,
                               onDragStart,
                               onDragEnd,
                               onMouseEnter,
                               onMouseLeave,
                               isHighlighted,
                               isDragOver,
                               className = '',
                               renderContent
                           }) => {
    return (
        <div
            className={`draggable-employee ${className} ${isHighlighted ? 'employee-highlighted' : ''} ${isDragOver ? 'drag-over' : ''}`}
            data-employee-id={employee.empId}
            data-employee-data={JSON.stringify(employee)}
            draggable={isEditMode}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}

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