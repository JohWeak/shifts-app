import React from 'react';
import DraggableEmployee from '../../../DraggableEmployee';

// Этот компонент отвечает за нового, еще не сохраненного сотрудника
const PendingEmployee = ({
                             assignment,
                             isEditing,
                             isHighlighted,
                             formatEmployeeName,
                             onCancelClick,
                             onMouseEnter,
                             onMouseLeave,
                             dnd,
                             cellData,
                             pendingChange
                         }) => {
    const employeeData = {
        empId: assignment.empId,
        name: assignment.empName,
        assignmentId: null,
        isPending: true,
        pendingKey: pendingChange.key
    };

    const employeeForFormat = {
        first_name: assignment.empName?.split(' ')[0] || '',
        last_name: assignment.empName?.split(' ').slice(1).join(' ') || ''
    };

    const getClassName = () => {
        let classes = 'mb-1 d-flex align-items-center justify-content-between employee-item pending-assignment';
        if (pendingChange.isAutofilled) classes += ' autofilled-employee';
        if (pendingChange.isCrossSite) classes += ' cross-site-employee';
        if (pendingChange.isCrossPosition) classes += ' cross-position-employee';
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
                    <span className="employee-name text-success">
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