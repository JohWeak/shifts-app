// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/DraggableEmployee/index.js
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
                               cellData,
                               className = '',
                               renderContent
                           }) => {
    return (
        <div
            className={`draggable-employee ${className} ${isHighlighted ? 'employee-highlighted' : ''} ${isDragOver ? 'drag-over' : ''}`}
            data-employee-id={employee.empId}
            data-employee-data={JSON.stringify(employee)}
            draggable={isEditMode}
            onDragStart={(e) => isEditMode && onDragStart && onDragStart(e, employee, cellData)}
            onDragEnd={(e) => isEditMode && onDragEnd && onDragEnd(e)}
            onMouseEnter={() => onMouseEnter && onMouseEnter(employee.empId)}
            onMouseLeave={onMouseLeave}
            onDragEnter={(e) => {
                if (isEditMode) {
                    e.stopPropagation();
                    e.currentTarget.classList.add('drag-over');
                }
            }}
            onDragOver={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onDragLeave={(e) => {
                if (isEditMode) {
                    e.currentTarget.classList.remove('drag-over', 'is-duplicate');
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

