import React from 'react';
import DraggableEmployee from '../../../DraggableEmployee';
import './PendingEmployee.css';

// Этот компонент отвечает за нового, еще не сохраненного сотрудника
const PendingEmployee = ({
                             assignment,
                             isEditing,
                             isHighlighted,
                             formatEmployeeName,
                             onCancelClick,
                             onNameClick,
                             onMouseEnter,
                             onMouseLeave,
                             dnd,
                             cellData,
                             pendingChange,
                             isCrossPosition,
                             isCrossSite,
                             isFlexible,
                             onSpareResize,
                             resizeState
                         }) => {
    const employeeData = {
        empId: assignment.empId,
        name: assignment.empName,
        assignmentId: null,
        isPending: true,
        pendingKey: pendingChange.key,
        isCrossPosition: isCrossPosition || pendingChange?.isCrossPosition,
        isCrossSite: isCrossSite || pendingChange?.isCrossSite,
        isFlexible: isFlexible || pendingChange?.isFlexible,
        // Add shift timing data for pending employees  
        shift_start_time: pendingChange?.shift_start_time,
        shift_end_time: pendingChange?.shift_end_time,
        custom_start_time: pendingChange?.custom_start_time,
        custom_end_time: pendingChange?.custom_end_time
    };

    const employeeForFormat = {
        first_name: assignment.empName?.split(' ')[0] || '',
        last_name: assignment.empName?.split(' ').slice(1).join(' ') || ''
    };

    const getClassName = () => {
        let classes = 'mb-1 d-flex align-items-center justify-content-between employee-item pending-assignment';
        if (pendingChange?.isAutofilled && !pendingChange?.isSaved) {
            classes += ' autofilled-employee';
        }
        if (isCrossSite || pendingChange?.isCrossSite) {
            classes += ' cross-site-employee';
        }
        if (isCrossPosition || pendingChange?.isCrossPosition) {
            classes += ' cross-position-employee';
        }
        if (isFlexible || pendingChange?.isFlexible) {
            classes += ' flexible-employee'; // This is for cross-site flexible workers
        }
        if (pendingChange?.assignment_type === 'spare') {
            classes += ' spare-employee'; // This is for spare shifts
        }
        if (isHighlighted) classes += ' highlighted';
        return classes;
    };

    const handleResizeStart = (e, direction, employeeData, cellData) => {
        e.stopPropagation();
        if (onSpareResize) {
            onSpareResize(e, direction, employeeData, cellData);
        }
    };

    return (
        <DraggableEmployee
            employee={employeeData}
            isEditMode={isEditing}
            cellData={cellData}
            onDragStart={(e) => dnd.handleDragStart(e, employeeData, cellData)}
            onDragEnd={dnd.handleDragEnd}
            isDragOver={dnd.dragOverEmployeeId === assignment.empId}
            onMouseEnter={() => onMouseEnter(assignment.empId)}
            onMouseLeave={onMouseLeave}
            isHighlighted={isHighlighted}
            className={getClassName()}
            showResizeHandles={true}
            onResizeStart={handleResizeStart}
            renderContent={() => (
                <>
                    <span
                        className="employee-name text-success employee-clickable"
                        onClick={(e) => {
                            if (isEditing && onNameClick) {
                                e.stopPropagation();
                                onNameClick(e, assignment.empId);
                            }
                        }}
                        style={{cursor: isEditing ? 'pointer' : 'default'}}
                        title={isEditing ? 'Click to replace this employee' : ''}
                    >
                        <div className="badge-container">
                            {(isCrossPosition || pendingChange?.isCrossPosition) && (
                                <span className="badge-indicator cross-position-badge" title="Cross-position">
                                <i className="bi bi-arrow-left-right"></i>
                            </span>
                            )}
                            {(isCrossSite || pendingChange?.isCrossSite) && (
                                <span className="badge-indicator cross-site-badge" title="Cross-site">
                                <i className="bi bi-building"></i>
                            </span>
                            )}
                            {(pendingChange?.assignment_type === 'spare') && (
                                <span className="badge-indicator spare-badge" title="Spare">
                                <i className="bi bi-shuffle"></i>
                            </span>
                            )}
                        </div>
                        {formatEmployeeName(employeeForFormat)}
                        
                        {/* Show temporary times during resize */}
                        {resizeState?.isResizing && resizeState?.resizeData?.employee?.empId === assignment.empId && resizeState?.resizeData?.employee?.pendingKey === employeeData.pendingKey && resizeState?.tempTime && (
                            <div className="custom-hours-display">
                                <small className="text-primary fw-bold">
                                    {resizeState.tempTime.start_time?.substring(0, 5)}
                                    -
                                    {resizeState.tempTime.end_time?.substring(0, 5)}
                                    <span className="ms-1">({resizeState.tempTime.duration}h)</span>
                                </small>
                            </div>
                        )}
                    </span>

                    {isEditing && (
                        <button
                            type="button"
                            className="remove-btn btn btn-sm btn-outline-danger"
                            onClick={(e) => onCancelClick(e, employeeData.pendingKey)}
                            title="Cancel assignment"
                        >
                            <i className="bi bi-x icon-x"></i>
                        </button>
                    )}
                </>
            )}
        />
    );
};

export default PendingEmployee;