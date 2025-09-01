// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/ScheduleCell/components/PendingEmployee/index.js
import React from 'react';
import DraggableEmployee from '../../../DraggableEmployee';
import './AssignedEmployee.css';

const AssignedEmployee = ({
                              employee,
                              isEditing,
                              isHighlighted,
                              isBeingReplaced,
                              formatEmployeeName,
                              onNameClick,
                              onRemoveClick,
                              onMouseEnter,
                              onMouseLeave,
                              dnd,
                              cellData,
                              isCrossPosition,
                              isCrossSite,
                              isFlexible,
                              onSpareResize,
                              resizeState
                          }) => {
    const employeeData = {
        empId: employee.emp_id,
        name: formatEmployeeName(employee),
        assignmentId: employee.assignment_id,
        isPending: false,
        isCrossPosition: isCrossPosition || employee.isCrossPosition,
        isCrossSite: isCrossSite || employee.isCrossSite,
        isFlexible: isFlexible || employee.isFlexible,
        // Add shift timing data
        shift_start_time: employee.shift_start_time,
        shift_end_time: employee.shift_end_time,
        custom_start_time: employee.custom_start_time,
        custom_end_time: employee.custom_end_time
    };


    const getClassName = () => {
        let classes = 'mb-1 d-flex align-items-center justify-content-between employee-item assigned-employee';
        if (isBeingReplaced) classes += ' being-replaced';
        if (isHighlighted) classes += ' highlighted';
        if (isCrossPosition || employee.isCrossPosition) classes += ' cross-position-employee';
        if (isCrossSite || employee.isCrossSite) classes += ' cross-site-employee';
        if (employee.assignment_type === 'spare') {
            classes += ' spare-employee';

            // Add spanning indicator if spare shift spans multiple regular shifts
            if (employee.spans_shifts && employee.spans_shifts.length > 1) {
                classes += ' spans-multiple';
            }

            // Add cross-day indicator if custom times span across days
            if (employee.custom_start_time && employee.custom_end_time) {
                const startHour = parseInt(employee.custom_start_time.split(':')[0]);
                const endHour = parseInt(employee.custom_end_time.split(':')[0]);
                if (endHour < startHour) { // Overnight span
                    classes += ' cross-day-span';
                }
            }
        }
        if (isFlexible || employee.isFlexible) classes += ' flexible-employee';
        return classes;
    };

    const handleResizeStart = (e, direction, employeeData, cellData) => {
        // Debug removed
        e.stopPropagation();
        if (onSpareResize) {
            onSpareResize(e, direction, employeeData, cellData);
        } else {
            console.log('❌ onSpareResize is not defined!');
        }
    };

    return (
        <DraggableEmployee
            employee={employeeData}
            isEditMode={isEditing}
            cellData={cellData}
            onDragStart={(e) => dnd.handleDragStart(e, employeeData, cellData)}
            onDragEnd={dnd.handleDragEnd}
            isDragOver={dnd.dragOverEmployeeId === employee.emp_id}
            onMouseEnter={() => onMouseEnter(employee.emp_id)}
            onMouseLeave={onMouseLeave}
            isHighlighted={isHighlighted}
            className={getClassName()}
            showResizeHandles={true}
            onResizeStart={handleResizeStart}
            renderContent={() => (
                <>
                    <span
                        className={`employee-name employee-clickable ${isEditing ? 'employee-editable' : ''}`}
                        onClick={(e) => onNameClick(e, employee.emp_id)}
                        style={{cursor: isEditing ? 'pointer' : 'default'}}
                        title={isEditing ? 'Click to replace this employee' : ''}
                    >
                        {isEditing && (
                            <div className="badge-container">
                                {(isCrossPosition || employee.isCrossPosition) && (
                                    <span className="badge-indicator cross-position-badge" title="Cross-position">
                                <i className="bi bi-arrow-left-right"></i>
                            </span>
                                )}
                                {(isCrossSite || employee.isCrossSite) && (
                                    <span className="badge-indicator cross-site-badge" title="Cross-site">
                                <i className="bi bi-building"></i>
                            </span>
                                )}
                                {(employee.assignment_type === 'spare') && (
                                    <span className="badge-indicator spare-badge" title="Spare">
                                <i className="bi bi-shuffle"></i>
                            </span>
                                )}
                            </div>
                        )}

                        {employeeData.name}

                        {/* Show temporary times during resize */}
                        {resizeState?.isResizing && resizeState?.resizeData?.employee?.empId === employee.emp_id && resizeState?.resizeData?.employee?.assignmentId === employee.assignment_id && resizeState?.tempTime && (
                            <div className="custom-hours-display">
                                <small className="text-primary fw-bold">
                                    {resizeState.tempTime.start_time?.substring(0, 5)}
                                    -
                                    {resizeState.tempTime.end_time?.substring(0, 5)}
                                    <span className="ms-1">({resizeState.tempTime.duration}h)</span>
                                </small>
                            </div>
                        )}

                        {/* Custom hours for any assignments with custom times */}
                        {!resizeState?.isResizing && (employee.custom_start_time || employee.custom_end_time) && (
                            <div className="custom-hours-display">
                                <small className="text-danger fw-bold">
                                    {employee.custom_start_time?.substring(0, 5) || employee.shift_start_time?.substring(0, 5)}
                                    -
                                    {employee.custom_end_time?.substring(0, 5) || employee.shift_end_time?.substring(0, 5)}
                                </small>
                            </div>
                        )}
                    </span>
                    {isEditing && (
                        <button
                            type="button"
                            className="remove-btn btn btn-sm btn-danger"
                            onClick={(e) => onRemoveClick(e, employee.emp_id, employee.assignment_id)}
                            title="Remove employee"
                        >
                            <i className="bi bi-x icon-x"></i>
                        </button>
                    )}
                </>
            )}
        />
    );
};

export default AssignedEmployee;