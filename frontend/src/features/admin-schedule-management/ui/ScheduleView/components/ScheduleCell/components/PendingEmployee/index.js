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
                             isFlexible
                         }) => {
    const employeeData = {
        empId: assignment.empId,
        name: assignment.empName,
        assignmentId: null,
        isPending: true,
        pendingKey: pendingChange.key,
        isCrossPosition: isCrossPosition || pendingChange?.isCrossPosition,
        isCrossSite: isCrossSite || pendingChange?.isCrossSite,
        isFlexible: isFlexible || pendingChange?.isFlexible
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
            classes += ' flexible-employee';
        }
        if (isHighlighted) classes += ' highlighted';
        return classes;
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
                            {(isFlexible || pendingChange?.isFlexible) && (
                                <span className="badge-indicator flexible-badge" title="Flexible">
                                <i className="bi bi-shuffle"></i>
                            </span>
                            )}
                        </div>
                            {formatEmployeeName(employeeForFormat)}
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