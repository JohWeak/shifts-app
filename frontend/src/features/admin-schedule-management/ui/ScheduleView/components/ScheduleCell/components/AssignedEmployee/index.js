// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/ScheduleCell/components/PendingEmployee/index.js
import React from 'react';
import DraggableEmployee from '../../../DraggableEmployee';

// Этот компонент отвечает за уже сохраненного, существующего сотрудника
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
                              cellData
                          }) => {
    const employeeData = {
        empId: employee.emp_id,
        name: formatEmployeeName(employee),
        assignmentId: employee.assignment_id,
        isPending: false
    };

    const getClassName = () => {
        let classes = 'mb-1 d-flex align-items-center justify-content-between employee-item';
        if (isBeingReplaced) classes += ' being-replaced';
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