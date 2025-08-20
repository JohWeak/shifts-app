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
                          }) => {
    const employeeData = {
        empId: employee.emp_id,
        name: formatEmployeeName(employee),
        assignmentId: employee.assignment_id,
        isPending: false,
        isCrossPosition: isCrossPosition || employee.isCrossPosition,
        isCrossSite: isCrossSite || employee.isCrossSite,
        isFlexible: isFlexible || employee.isFlexible
    };


    const getClassName = () => {
        let classes = 'mb-1 d-flex align-items-center justify-content-between employee-item assigned-employee';
        if (isBeingReplaced) classes += ' being-replaced';
        if (isHighlighted) classes += ' highlighted';
        if (isCrossPosition || employee.isCrossPosition) classes += ' cross-position-employee';
        if (isCrossSite || employee.isCrossSite) classes += ' cross-site-employee';
        if (isFlexible || employee.isFlexible) classes += ' flexible-employee';
        return classes;
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
            renderContent={() => (
                <>
                    <span
                        className={`employee-name employee-clickable ${isEditing ? 'employee-editable' : ''}`}
                        onClick={(e) => onNameClick(e, employee.emp_id)}
                        style={{ cursor: isEditing ? 'pointer' : 'default' }}
                        title={isEditing ? 'Click to replace this employee' : ''}
                    >
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
                        {(isFlexible || employee.isFlexible) && (
                            <span className="badge-indicator flexible-badge" title="Flexible">
                                <i className="bi bi-shuffle"></i>
                            </span>
                        )}
                            </div>

                        {employeeData.name}
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