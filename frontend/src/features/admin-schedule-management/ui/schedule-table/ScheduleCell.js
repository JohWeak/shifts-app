// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleCell.js
import React from 'react';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import './ScheduleCell.css';

const ScheduleCell = ({
                          date,
                          positionId,
                          shiftId,
                          employees = [],
                          pendingAssignments = [],
                          pendingRemovals = [],
                          isEditing = false,
                          isUnderstaffed = false,
                          requiredEmployees = 1,
                          onCellClick,
                          onEmployeeClick,
                          onRemoveEmployee,
                          onRemovePendingChange,  // Добавить в пропсы
                          pendingChanges = {},
                          className = '',
                          formatEmployeeName = null,
                          shiftColor = null,
                          ...props
                      }) => {
    const {t} = useI18n();

    // ПРОСТАЯ логика: удаленные работники не показываются вообще
    const visibleEmployees = employees.filter(emp =>
        !pendingRemovals.some(removal => removal.empId === emp.emp_id)
    );

    const totalEmployees = visibleEmployees.length + pendingAssignments.length;
    const isEmpty = totalEmployees === 0;
    const isFull = totalEmployees >= requiredEmployees;

    const handleCellClick = (e) => {
        if (e.target.closest('.remove-btn') || e.target.closest('.employee-clickable')) {
            return; // Не открываем модал если кликнули на работника или кнопку
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

    // НОВАЯ функция для клика на работника
    const handleEmployeeNameClick = (e, empId) => {
        e.preventDefault();
        e.stopPropagation();

        if (onEmployeeClick && isEditing) {
            onEmployeeClick(date, positionId, shiftId, empId);
        }
    };

    // Для ячейки с сотрудниками, добавляем класс has-employees:
    const getCellClasses = () => {
        const baseClasses = ['schedule-cell', 'text-center', 'position-relative'];

        if (className) baseClasses.push(className);
        if (isEditing) baseClasses.push('editing-mode');
        if (!isEmpty) baseClasses.push('has-employees');
        if (isEmpty && isEditing) baseClasses.push('table-warning');
        if (isUnderstaffed && !isEmpty) baseClasses.push('table-info');

        if (isFull && !shiftColor) baseClasses.push('table-success');

        return baseClasses.join(' ');
    };

    const getCellStyle = () => {
        const styles = {};

        if (shiftColor && !isEmpty) {
            // Только лёгкий фон, без границ
            styles.backgroundColor = `${shiftColor}20`;
        }

        return styles;
    };
    // Render empty cell
    if (isEmpty) {
        return (
            <td
                className={getCellClasses()}
                onClick={handleCellClick}
                style={shiftColor && isEditing ? { borderLeft: `4px solid ${shiftColor}` } : {}}
                title={isEditing ? t('employee.clickToAssign') : ''}
                {...props}
            >
                <div className="empty-cell">
                    {isEditing ? (
                        <div className="text-muted">
                            <i className="bi bi-plus-circle fs-7"></i>
                        </div>
                    ) : (
                        <span className="text-muted">-</span>
                    )}
                </div>
            </td>
        );
    }


    // Render cell with employees
    return (
        <td
            className={getCellClasses()}
            onClick={handleCellClick}
            style={getCellStyle()}
            title={isEditing ? 'Click on employee name to replace, or click empty space to add' : ''}
            {...props}
        >
            <div className="employees-container">
                {/* Visible Employees (не удаленные) */}
                {visibleEmployees.map((employee) => (
                    <div
                        key={`visible-${employee.emp_id}`}
                        className="employee-item mb-1 d-flex align-items-center justify-content-between"
                        style={{fontSize: '0.8em'}}
                    >
        <span
            className={`employee-name employee-clickable ${isEditing ? 'employee-editable' : ''}`}
            onClick={(e) => handleEmployeeNameClick(e, employee.emp_id)}
            style={{
                cursor: isEditing ? 'pointer' : 'default',
                textDecoration: isEditing ? 'underline' : 'none',
            }}
            title={isEditing ? 'Click to replace this employee' : ''}
        >
            {formatEmployeeName
                ? formatEmployeeName(employee)
                : `${employee.first_name} ${employee.last_name}`}
        </span>

                        {isEditing && (
                            <button
                                type="button"
                                className="remove-btn btn btn-sm btn-outline-danger p-0 ms-1"
                                onClick={(e) => handleRemoveClick(e, employee.emp_id, employee.assignment_id)} // Передаём assignment_id
                                title="Remove employee"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}

                {/* Pending Assignments (новые работники) */}
                {pendingAssignments.map((assignment, index) => (
                    <div
                        key={`pending-${assignment.empId}-${index}`}
                        className="employee-item mb-1 d-flex align-items-center justify-content-between pending-assignment"
                        style={{fontSize: '0.8em'}}
                    >
                        <span
                            className="employee-name text-success"
                            style={{fontStyle: 'italic'}}
                        >
                            {formatEmployeeName && assignment.employee
                                ? formatEmployeeName(assignment.employee)
                                : (assignment.empName || 'New Employee')}
                        </span>
                        <div className="d-flex align-items-center">
                            {isEditing && onRemovePendingChange && (
                                <button
                                    type="button"
                                    className="remove-btn btn btn-sm btn-outline-danger p-0"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Найти и удалить правильный pending change
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
                                    x
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add more employees indicator */}
                {isEditing && totalEmployees < requiredEmployees && (
                    <div className="add-more-indicator mt-1">
                        <small className="text-muted">
                            <i className="bi bi-plus-circle me-1"></i>
                            Need {requiredEmployees - totalEmployees} more
                        </small>
                    </div>
                )}
            </div>
        </td>
    );
};

export default ScheduleCell;