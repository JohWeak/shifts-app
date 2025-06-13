// frontend/src/CompareAlgorithmsModal.js/admin/schedule/ScheduleCell.js
import React from 'react';
import { Badge } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';

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
                          onEmployeeClick, // НОВЫЙ проп для клика на работника
                          onRemoveEmployee,
                          className = '',
                          ...props
                      }) => {
    const messages = useMessages('en');

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

    const handleRemoveClick = (e, empId) => {
        e.preventDefault();
        e.stopPropagation();

        if (onRemoveEmployee) {
            onRemoveEmployee(date, positionId, shiftId, empId);
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

    const getCellClasses = () => {
        const baseClasses = ['schedule-cell', 'text-center', 'position-relative'];

        if (className) baseClasses.push(className);
        if (isEditing) baseClasses.push('editing-mode');
        if (isEmpty && isEditing) baseClasses.push('table-warning');
        if (isUnderstaffed && !isEmpty) baseClasses.push('table-info');
        if (isFull) baseClasses.push('table-success');

        return baseClasses.join(' ');
    };

    const getCursor = () => isEditing ? 'pointer' : 'default';

    // Render empty cell
    if (isEmpty) {
        return (
            <td
                className={getCellClasses()}
                onClick={handleCellClick}
                style={{
                    cursor: getCursor(),
                    minHeight: '60px',
                    padding: '8px',
                    verticalAlign: 'middle'
                }}
                title={isEditing ? messages.CLICK_TO_ADD_EMPLOYEE : ''}
                {...props}
            >
                <div className="empty-cell d-flex align-items-center justify-content-center">
                    {isEditing ? (
                        <div className="text-muted">
                            <i className="bi bi-plus-circle fs-7"></i>
                            {/*<div style={{ fontSize: '0.7em' }}>*/}
                            {/*    {messages.CLICK_TO_ASSIGN || 'Click to assign'}*/}
                            {/*</div>*/}

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
            style={{
                cursor: getCursor(),
                minHeight: '60px',
                padding: '8px',
                verticalAlign: 'top'
            }}
            title={isEditing ? 'Click on employee name to replace, or click empty space to add' : ''}
            {...props}
        >
            <div className="employees-container">
                {/* Visible Employees (не удаленные) */}
                {visibleEmployees.map((employee) => (
                    <div
                        key={`visible-${employee.emp_id}`}
                        className="employee-item mb-1 d-flex align-items-center justify-content-between"
                        style={{ fontSize: '0.8em' }}
                    >
                        <span
                            className={`employee-name employee-clickable ${isEditing ? 'text-primary' : ''}`}
                            onClick={(e) => handleEmployeeNameClick(e, employee.emp_id)}
                            style={{
                                cursor: isEditing ? 'pointer' : 'default',
                                textDecoration: isEditing ? 'underline' : 'none'
                            }}
                            title={isEditing ? 'Click to replace this employee' : ''}
                        >
                            {employee.first_name} {employee.last_name}
                        </span>

                        {isEditing && (
                            <button
                                type="button"
                                className="remove-btn btn btn-sm btn-outline-danger p-0 ms-1"
                                onClick={(e) => handleRemoveClick(e, employee.emp_id)}
                                title="Remove employee"
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    fontSize: '12px',
                                    lineHeight: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000,
                                    position: 'relative'
                                }}
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
                        style={{ fontSize: '0.8em' }}
                    >
                        <span
                            className="employee-name text-success"
                            style={{ fontStyle: 'italic' }}
                        >
                            {assignment.empName}
                        </span>
                        <div className="d-flex align-items-center">
                            <Badge bg="success" style={{ fontSize: '0.6em' }} className="me-1">
                                New
                            </Badge>
                            {isEditing && (
                                <button
                                    type="button"
                                    className="remove-btn btn btn-sm btn-outline-secondary p-0"
                                    onClick={(e) => handleRemoveClick(e, assignment.empId)}
                                    title="Cancel assignment"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        fontSize: '10px',
                                        lineHeight: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1000,
                                        position: 'relative'
                                    }}
                                >
                                    ×
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