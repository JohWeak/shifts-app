// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/ScheduleCell/index.js

import React from 'react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import AssignedEmployee from './components/AssignedEmployee';
import PendingEmployee from './components/PendingEmployee';
import './ScheduleCell.css';

const ScheduleCell = ({
                          date,
                          shiftId,
                          positionId,
                          employees = [],
                          pendingAssignments = [],
                          pendingRemovals = [],
                          pendingChanges = {},
                          isEditing = false,
                          requiredEmployees = 1,
                          onCellClick,
                          onEmployeeClick,
                          onRemoveEmployee,
                          onRemovePendingChange,
                          formatEmployeeName,
                          highlightedEmployeeId,
                          onEmployeeMouseEnter,
                          onEmployeeMouseLeave,
                          dnd,
                          onDrop,
                          selectedCell,
                          className = ''
                      }) => {
    const { t } = useI18n();

    const visibleEmployees = employees.filter(emp => !pendingRemovals.some(r => r.empId === emp.emp_id));
    const totalEmployees = visibleEmployees.length + pendingAssignments.length;

    const getCellClasses = () => {
        let classes = 'schedule-cell text-center position-relative';
        if (className) classes += ` ${className}`;
        if (isEditing) classes += ' editing-mode';
        if (totalEmployees > 0) classes += ' has-employees';
        if (totalEmployees === 0 && isEditing) classes += ' empty-editing';
        if (totalEmployees > 0 && totalEmployees < requiredEmployees) classes += ' understaffed';
        if (totalEmployees > requiredEmployees) classes += ' overstaffed';
        if (totalEmployees === requiredEmployees) classes += ' full';
        if (pendingAssignments.length > 0 || pendingRemovals.length > 0) classes += ' has-pending-change';
        return classes;
    };

    const handleCellClick = (e) => {
        if (e.target.closest('.remove-btn, .employee-clickable, .draggable-employee') || !isEditing) return;
        onCellClick(date, positionId, shiftId);
    };

    const handleRemoveClick = (e, empId, assignmentId) => {
        e.stopPropagation();
        onRemoveEmployee(date, positionId, shiftId, empId, assignmentId);
    };

    const handleCancelClick = (e, changeKey) => {
        e.stopPropagation();
        onRemovePendingChange(changeKey);
    };

    const handleEmployeeNameClick = (e, empId) => {
        e.stopPropagation();
        if(isEditing) onEmployeeClick(date, positionId, shiftId, empId);
    };

    const isEmployeeBeingReplaced = (empId) => {
        return isEditing && selectedCell?.positionId === positionId && selectedCell?.date === date && selectedCell?.shiftId === shiftId && selectedCell?.employeeIdToReplace === empId;
    };

    const cellData = { date, shiftId, positionId };

    return (
        <td
            className={getCellClasses()}
            onClick={handleCellClick}
            onDragOver={(e) => dnd.handleDragOver(e, cellData)}
            onDragEnter={(e) => e.currentTarget.classList.add('drag-over')}
            onDragLeave={dnd.handleDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over', 'has-duplicate');
                document.querySelectorAll('.is-duplicate').forEach(el => el.classList.remove('is-duplicate'));
                const dropTargetEl = e.target.closest('.draggable-employee');
                const targetEmployeeData = dropTargetEl ? JSON.parse(dropTargetEl.dataset.employeeData) : null;
                onDrop(cellData, targetEmployeeData);
            }}
        >
            <div className="employees-container">
                {visibleEmployees.map(employee => (
                    <AssignedEmployee
                        key={`assigned-${employee.emp_id}`}
                        employee={employee}
                        isEditing={isEditing}
                        isHighlighted={highlightedEmployeeId === employee.emp_id}
                        isBeingReplaced={isEmployeeBeingReplaced(employee.emp_id)}
                        formatEmployeeName={formatEmployeeName}
                        onNameClick={handleEmployeeNameClick}
                        onRemoveClick={handleRemoveClick}
                        onMouseEnter={onEmployeeMouseEnter}
                        onMouseLeave={onEmployeeMouseLeave}
                        dnd={dnd}
                        cellData={cellData}
                    />
                ))}
                {pendingAssignments.map((assignment) => {
                    const changeKey = Object.keys(pendingChanges).find(key => pendingChanges[key].action === 'assign' && pendingChanges[key].empId === assignment.empId && pendingChanges[key].positionId === positionId && pendingChanges[key].date === date && pendingChanges[key].shiftId === shiftId);
                    const pendingChange = changeKey ? { key: changeKey, ...pendingChanges[changeKey] } : null;
                    if (!pendingChange) return null;

                    return (
                        <PendingEmployee
                            key={`pending-${assignment.empId}`}
                            assignment={assignment}
                            isEditing={isEditing}
                            isHighlighted={highlightedEmployeeId === assignment.empId}
                            formatEmployeeName={formatEmployeeName}
                            onCancelClick={handleCancelClick}
                            onMouseEnter={onEmployeeMouseEnter}
                            onMouseLeave={onEmployeeMouseLeave}
                            dnd={dnd}
                            cellData={cellData}
                            pendingChange={pendingChange}
                        />
                    );
                })}
                {isEditing && totalEmployees < requiredEmployees && (
                    <div className="add-more-indicator">
                        <small className="fw-bold "><i className="bi bi-plus-circle me-1"></i>{t('employee.needMoreEmployees', { count: (requiredEmployees - totalEmployees) })}</small>
                    </div>
                )}
            </div>
        </td>
    );
};

export default ScheduleCell;