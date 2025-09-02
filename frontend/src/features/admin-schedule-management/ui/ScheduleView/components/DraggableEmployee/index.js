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
                               renderContent,
                               onResizeStart,
                               onResize,
                               onResizeEnd,
                               showResizeHandles = false,
                               stretchData = null // { scaleX, scaleY, isTemporary, customTimes }
                           }) => {
    const isStretched = !!stretchData;

    // Calculate stretch background styles
    const stretchBackgroundStyles = stretchData ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: `scaleY(${stretchData.scaleY || 1}) scaleX(${stretchData.scaleX || 1})`,
        transformOrigin: 'top left',
        backgroundColor: stretchData.isTemporary ? 'rgba(255, 193, 7, 0.3)' : 
                         (stretchData.isPending ? 'rgba(40, 167, 69, 0.2)' : 'rgba(156, 39, 176, 0.3)'),
        border: stretchData.isTemporary ? '2px solid #ffc107' : 
                (stretchData.isPending ? '2px solid #28a745' : '2px solid #9c27b0'),
        borderRadius: '4px',
        zIndex: -1, // Behind content
        pointerEvents: 'none'
    } : null;

    return (
        <div
            className={`draggable-employee ${className} ${isHighlighted ? 'employee-highlighted' : ''} ${isDragOver ? 'drag-over' : ''} ${isStretched ? 'stretched-employee' : ''}`}
            data-employee-id={employee.empId}
            data-employee-data={JSON.stringify(employee)}
            style={{ position: 'relative', zIndex: isStretched ? 1000 : 'auto' }}
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
            {/* Stretch background - only stretches background, not content */}
            {stretchBackgroundStyles && (
                <div style={stretchBackgroundStyles}></div>
            )}

            {/* Resize handles for spare shifts */}
            {showResizeHandles && isEditMode && (
                <>
                    <div 
                        className="resize-handle resize-handle-top"
                        onMouseDown={(e) => onResizeStart && onResizeStart(e, 'start', employee, cellData)}
                        title="Adjust start time"
                    >
                        ↕
                    </div>
                    <div 
                        className="resize-handle resize-handle-bottom"
                        onMouseDown={(e) => onResizeStart && onResizeStart(e, 'end', employee, cellData)}
                        title="Adjust end time"
                    >
                        ↕
                    </div>
                </>
            )}
            
            {renderContent ? renderContent() : (
                <span className="employee-name">
                    {employee.name}
                </span>
            )}
        </div>
    );
};

export default DraggableEmployee;

