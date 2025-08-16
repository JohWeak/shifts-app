// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleCell.js
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import DraggableEmployee from './DraggableEmployee';
import './ScheduleCell.css';


const ScheduleCell = ({
                          date,
                          selectedCell,
                          positionId,
                          shiftId,
                          employees = [],
                          pendingAssignments = [],
                          pendingRemovals = [],
                          isEditing = false,
                          requiredEmployees = 1,
                          onAddPendingChange,
                          onCellClick,
                          onEmployeeClick,
                          onRemoveEmployee,
                          onRemovePendingChange,
                          pendingChanges = {},
                          className = '',
                          formatEmployeeName = null,
                          shiftColor = null,
                          highlightedEmployeeId,
                          onEmployeeMouseEnter,
                          onEmployeeMouseLeave,
                          dnd,
                          onDrop,
                          ...props
                      }) => {
    const {t} = useI18n();

    const visibleEmployees = employees.filter(emp =>
        !pendingRemovals.some(removal => removal.empId === emp.emp_id)
    );

    const totalEmployees = visibleEmployees.length + pendingAssignments.length;
    const isEmpty = totalEmployees === 0;
    const isFull = totalEmployees === requiredEmployees;
    const isUnderstaffed = totalEmployees < requiredEmployees;
    const isOverstaffed = totalEmployees > requiredEmployees;

    const hasPendingChanges = () => {
        return Object.values(pendingChanges).some(change =>
            change.positionId === positionId &&
            change.date === date &&
            change.shiftId === shiftId
        );
    };

    const handleEmployeeNameClick = (e, empId) => {
        e.preventDefault();
        e.stopPropagation();

        if (onEmployeeClick && isEditing) {
            onEmployeeClick(date, positionId, shiftId, empId);
        }
    };

    const isEmployeeBeingReplaced = (empId) => {
        return isEditing &&
            selectedCell?.positionId === positionId &&
            selectedCell?.date === date &&
            selectedCell?.shiftId === shiftId &&
            selectedCell?.employeeIdToReplace === empId;
    };

    const handleCellClick = (e) => {
        if (e.target.closest('.remove-btn') ||
            e.target.closest('.employee-clickable') ||
            e.target.closest('.draggable-employee')) {
            return;
        }

        if (onCellClick && isEditing) {
            onCellClick(date, positionId, shiftId);
        }
    };

    const handleRemoveClick = (e, empId, assignmentId = null) => {
        e.preventDefault();
        e.stopPropagation();

        if (onRemoveEmployee) {
            onRemoveEmployee(date, positionId, shiftId, empId, assignmentId);
        }
    };

    // Helper to get employee styling classes
    const getEmployeeClassName = (employee, isPending = false) => {
        let classes = ['schedule-employee'];

        if (isPending) {
            classes.push('pending-employee');

            // Check if this is an autofilled employee
            const pendingChange = Object.values(pendingChanges).find(
                change => change.empId === employee.emp_id &&
                    change.date === date &&
                    change.shiftId === shiftId &&
                    change.positionId === positionId
            );

            if (pendingChange) {
                if (pendingChange.isAutofilled && !pendingChange.isSaved) {
                    classes.push('autofilled-employee');
                }
                if (pendingChange.isCrossPosition) {
                    classes.push('cross-position-employee');
                }
                if (pendingChange.isCrossSite) {
                    classes.push('cross-site-employee');
                }
            }
        }

        if (employee.emp_id === highlightedEmployeeId) {
            classes.push('highlighted');
        }

        return classes.join(' ');
    };

    const getCellClasses = () => {
        const baseClasses = ['schedule-cell', 'text-center', 'position-relative'];

        if (className) baseClasses.push(className);
        if (isEditing) baseClasses.push('editing-mode');
        if (!isEmpty) baseClasses.push('has-employees');
        if (isEmpty && isEditing) baseClasses.push('empty-editing');
        if (isUnderstaffed && !isEmpty) baseClasses.push('understaffed');
        if (isOverstaffed) baseClasses.push('overstaffed');
        if (isFull && !shiftColor) baseClasses.push('full');
        if (hasPendingChanges()) baseClasses.push('has-pending-change');

        return baseClasses.join(' ');
    };

    const getCellStyle = () => {
        const styles = {};
        if (shiftColor) {
            styles.backgroundColor = `${shiftColor}`;
        }
        return styles;
    };

    // Данные ячейки для drag&drop
    const cellData = {
        date: date,
        shiftId: shiftId,
        positionId: positionId
    };

    // Render cell
    return (
        <td
            className={getCellClasses()}
            onClick={handleCellClick}
            style={getCellStyle()}
            title={isEditing ? 'Click on employee name to replace, or Drag employees to move them between shifts' : ''}
            // Drag&drop handlers для всей ячейки
            onDragOver={(e) => dnd.handleDragOver(e, cellData)}
            onDragEnter={(e) => {
                e.currentTarget.classList.add('drag-over');
            }}
            onDragLeave={dnd.handleDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                // Убираем все классы drag
                e.currentTarget.classList.remove('drag-over', 'has-duplicate');
                document.querySelectorAll('.is-duplicate').forEach(el =>
                    el.classList.remove('is-duplicate')
                );

                const dropTargetEl = e.target.closest('.draggable-employee');
                const targetEmployeeData = dropTargetEl ?
                    JSON.parse(dropTargetEl.dataset.employeeData) : null;
                onDrop(cellData, targetEmployeeData);
            }}
        >
            <div className="employees-container">
                {/* Visible Employees с drag&drop */}
                {visibleEmployees.map((employee) => {
                    const employeeData = {
                        empId: employee.emp_id,
                        name: formatEmployeeName
                            ? formatEmployeeName(employee)
                            : `${employee.first_name} ${employee.last_name}`,
                        assignmentId: employee.assignment_id,
                        isPending: false
                    };

                    return (
                        <DraggableEmployee
                            key={`visible-${employee.emp_id}`}
                            employee={employeeData}
                            isEditMode={isEditing}
                            cellData={cellData}
                            onDragStart={(e) => dnd.handleDragStart(e, employeeData, cellData)}
                            onDragEnd={dnd.handleDragEnd}
                            isDragOver={dnd.dragOverEmployeeId === employee.emp_id}
                            onMouseEnter={() => onEmployeeMouseEnter(employee.emp_id)}
                            onMouseLeave={onEmployeeMouseLeave}
                            isHighlighted={highlightedEmployeeId === employee.emp_id}
                            className={`employee-item mb-1 d-flex align-items-center justify-content-between ${
                                isEmployeeBeingReplaced(employee.emp_id) ? 'being-replaced' : ''
                            }`}
                            renderContent={() => (
                                <>
                                    <span
                                        className={`employee-name employee-clickable ${isEditing ? 'employee-editable' : ''}`}
                                        onClick={(e) => handleEmployeeNameClick(e, employee.emp_id)}
                                        style={{
                                            cursor: isEditing ? 'pointer' : 'default',
                                        }}
                                        title={isEditing ? 'Click to replace this employee' : ''}
                                    >
                                        {employeeData.name}
                                    </span>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            className="remove-btn btn btn-sm btn-danger"
                                            onClick={(e) => handleRemoveClick(e, employee.emp_id, employee.assignment_id)}
                                            title="Remove employee"
                                        >
                                            <i className="bi bi-x icon-x"></i>
                                        </button>
                                    )}
                                </>
                            )}
                        />
                    );
                })}

                {/* Pending Assignments  */}
                {pendingAssignments.map((assignment, index) => {
                    const changeKey = Object.keys(pendingChanges).find(key => {
                        const change = pendingChanges[key];
                        return change.action === 'assign' &&
                            change.empId === assignment.empId &&
                            change.positionId === positionId &&
                            change.date === date &&
                            change.shiftId === shiftId;
                    });

                    const employeeData = {
                        empId: assignment.empId,
                        name: assignment.empName || 'New Employee',
                        assignmentId: null,
                        isPending: true,
                        pendingKey: changeKey
                    };

                    const employeeForFormat = {
                        first_name: assignment.empName?.split(' ')[0] || '',
                        last_name: assignment.empName?.split(' ').slice(1).join(' ') || ''
                    };

                    return (
                        <DraggableEmployee
                            key={`pending-${assignment.empId}-${index}`}
                            employee={employeeData}
                            isEditMode={isEditing}
                            cellData={cellData}
                            onDragStart={(e) => dnd.handleDragStart(e, employeeData, cellData)}
                            onDragEnd={dnd.handleDragEnd}
                            isDragOver={dnd.dragOverEmployeeId === assignment.emp_id}
                            onMouseEnter={() => onEmployeeMouseEnter(assignment.empId)}
                            onMouseLeave={onEmployeeMouseLeave}
                            isHighlighted={highlightedEmployeeId === assignment.empId}
                            className="employee-item mb-1 d-flex align-items-center justify-content-between pending-assignment"
                            renderContent={() => (
                                <>
                                    <span className="employee-name text-success">
                                        {formatEmployeeName
                                            ? formatEmployeeName(employeeForFormat)
                                            : assignment.empName || 'New Employee'}
                                    </span>
                                    <div className="d-flex align-items-center">
                                        {isEditing && onRemovePendingChange && (
                                            <button
                                                type="button"
                                                className="remove-btn btn btn-sm btn-outline-danger"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const changeKey = Object.keys(pendingChanges).find(key => {
                                                        const change = pendingChanges[key];
                                                        return change.action === 'assign' &&
                                                            change.empId === assignment.empId &&
                                                            change.positionId === positionId &&
                                                            change.date === date &&
                                                            change.shiftId === shiftId;
                                                    });
                                                    if (changeKey) {
                                                        onRemovePendingChange(changeKey);
                                                    }
                                                }}
                                                title="Cancel assignment"
                                            >
                                                <i className="bi bi-x icon-x"></i>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        />
                    );
                })}

                {/* Add more employees indicator */}
                {isEditing && totalEmployees < requiredEmployees && (
                    <div className="add-more-indicator">
                        <small className="fw-bold ">
                            <i className="bi bi-plus-circle me-1"></i>
                            {t('employee.needMoreEmployees', {count: (requiredEmployees - totalEmployees)})}
                        </small>
                    </div>
                )}

                {/* Empty cell content if no employees */}
                {/*{isEmpty && (*/}
                {/*    <div className="empty-cell">*/}
                {/*        {isEditing ? (*/}
                {/*            <div className="text-muted">*/}
                {/*                <i className="bi bi-plus-circle fs-7"></i>*/}
                {/*            </div>*/}
                {/*        ) : (*/}
                {/*            <span className="text-muted">-</span>*/}
                {/*        )}*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>
        </td>
    );
};

export default ScheduleCell;