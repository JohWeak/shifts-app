// frontend/src/components/admin/schedule/PositionScheduleEditor.js
import React from 'react';
import { Table, Badge, Button, Spinner } from 'react-bootstrap';
import { interpolateMessage, useMessages } from '../../../i18n/messages';

const PositionScheduleEditor = ({
                                    position,
                                    assignments = [],
                                    employees = [],
                                    shifts = [],
                                    scheduleDetails,
                                    isEditing = false, // Добавим default значение
                                    pendingChanges = {}, // Добавим default значение
                                    savingChanges = false, // Добавим default значение
                                    canEdit = true,
                                    onToggleEdit,
                                    onSaveChanges,
                                    onCellClick,
                                    onEmployeeRemove,
                                    onRemovePendingChange
                                }) => {
    const messages = useMessages('en');

    // Логирование для отладки
    console.log('PositionScheduleEditor render:', {
        positionId: position?.pos_id,
        isEditing,
        canEdit,
        hasToggleEdit: !!onToggleEdit,
        pendingChangesCount: Object.keys(pendingChanges).length
    });

    if (!position) {
        console.error('PositionScheduleEditor: position prop is undefined');
        return (
            <div className="alert alert-warning">
                Position data is missing
            </div>
        );
    }

    if (!scheduleDetails) {
        console.error('PositionScheduleEditor: scheduleDetails prop is undefined');
        return (
            <div className="alert alert-warning">
                Schedule details are missing
            </div>
        );
    }

    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    const renderCell = (shift, dayIndex) => {
        const date = new Date(scheduleDetails.schedule.start_date);
        date.setDate(date.getDate() + dayIndex);
        const dateStr = date.toISOString().split('T')[0];

        // Найти назначения для этой позиции, смены и даты
        const cellAssignments = assignments.filter(assignment =>
            assignment.position_id === position.pos_id &&
            assignment.shift_id === shift.shift_id &&
            assignment.work_date === dateStr
        );

        // Проверить наличие pending changes
        const pendingAssignments = Object.values(pendingChanges).filter(change =>
            change.action === 'assign' &&
            change.positionId === position.pos_id &&
            change.date === dateStr &&
            change.shiftId === shift.shift_id
        );

        const pendingRemovals = Object.values(pendingChanges).filter(change =>
            change.action === 'remove' &&
            change.positionId === position.pos_id &&
            change.date === dateStr &&
            change.shiftId === shift.shift_id
        );

        const currentAssignments = cellAssignments.length - pendingRemovals.length;
        const totalAssignments = currentAssignments + pendingAssignments.length;
        const isEmpty = totalAssignments === 0;
        const isUnderstaffed = totalAssignments < position.num_of_emp;

        return (
            <td
                key={dayIndex}
                className={`text-center ${isEditing ? 'position-relative' : ''} ${isEmpty && isEditing ? 'table-warning' : ''}`}
                style={{
                    cursor: isEditing ? 'pointer' : 'default',
                    minWidth: '120px',
                    verticalAlign: 'middle'
                }}
                onClick={() => {
                    if (isEditing && onCellClick) {
                        onCellClick({
                            positionId: position.pos_id,
                            shiftId: shift.shift_id,
                            date: dateStr,
                            position: position.pos_name,
                            shift: shift.shift_name
                        });
                    }
                }}
            >
                {/* Отображение назначений */}
                <div className="assignments-container">
                    {cellAssignments.map(assignment => (
                        <div key={assignment.id} className="assignment-item mb-1">
                            <Badge bg="primary" className="d-flex justify-content-between align-items-center">
                                <span>{assignment.employee.first_name} {assignment.employee.last_name}</span>
                                {isEditing && onEmployeeRemove && (
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white ms-2"
                                        aria-label="Remove"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEmployeeRemove(assignment.id, position.pos_id);
                                        }}
                                        style={{ fontSize: '0.6em' }}
                                    ></button>
                                )}
                            </Badge>
                        </div>
                    ))}

                    {/* Отображение pending assignments */}
                    {pendingAssignments.map((change, index) => (
                        <div key={`pending-${index}`} className="assignment-item mb-1">
                            <Badge bg="success" className="d-flex justify-content-between align-items-center">
                                <span>{change.empName}</span>
                                <small className="ms-1">(New)</small>
                                {onRemovePendingChange && (
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white ms-2"
                                        aria-label="Remove"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemovePendingChange(change.changeKey, position.pos_id);
                                        }}
                                        style={{ fontSize: '0.6em' }}
                                    ></button>
                                )}
                            </Badge>
                        </div>
                    ))}

                    {/* Показать если нужно больше сотрудников */}
                    {isUnderstaffed && isEditing && (
                        <div className="text-muted small">
                            {interpolateMessage(messages.NEED_MORE_EMPLOYEES, {
                                count: position.num_of_emp - totalAssignments
                            })}
                        </div>
                    )}

                    {/* Показать + если ячейка пустая и в режиме редактирования */}
                    {isEmpty && isEditing && (
                        <div className="text-muted">
                            <i className="bi bi-plus-circle fs-4"></i>
                        </div>
                    )}
                </div>
            </td>
        );
    };

    return (
        <div className="position-schedule-editor mb-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="mb-1">{position.pos_name}</h6>
                    <small className="text-muted">
                        {interpolateMessage(messages.REQUIRED_EMPLOYEES, {
                            count: position.num_of_emp
                        })}
                        {hasPendingChanges && (
                            <Badge bg="warning" className="ms-2">
                                {messages.UNSAVED_CHANGES}
                            </Badge>
                        )}
                    </small>
                </div>
                <div>
                    {/* Добавим подробное логирование для кнопки Edit */}
                    {canEdit && !isEditing && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                                console.log('Edit button clicked for position:', position.pos_id);
                                console.log('onToggleEdit function:', onToggleEdit);
                                if (onToggleEdit) {
                                    onToggleEdit(position.pos_id);
                                } else {
                                    console.error('onToggleEdit is not defined!');
                                }
                            }}
                        >
                            <i className="bi bi-pencil me-1"></i>
                            {messages.EDIT}
                        </Button>
                    )}

                    {isEditing && (
                        <>
                            <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                    console.log('Save button clicked for position:', position.pos_id);
                                    if (onSaveChanges) {
                                        onSaveChanges(position.pos_id);
                                    }
                                }}
                                disabled={savingChanges || !hasPendingChanges}
                            >
                                {savingChanges ? (
                                    <>
                                        <Spinner size="sm" className="me-1" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check me-1"></i>
                                        {messages.SAVE}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => {
                                    console.log('Cancel button clicked for position:', position.pos_id);
                                    if (onToggleEdit) {
                                        onToggleEdit(position.pos_id);
                                    }
                                }}
                                disabled={savingChanges}
                            >
                                {messages.CANCEL}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Добавим индикатор режима редактирования */}
            {isEditing && (
                <div className="alert alert-info mb-3">
                    <i className="bi bi-pencil me-2"></i>
                    Editing mode active for {position.pos_name}. Click on cells to assign employees.
                </div>
            )}

            {/* Schedule Table */}
            <Table responsive bordered size="sm" className="schedule-table">
                <thead>
                <tr>
                    <th className="shift-header">Shift</th>
                    <th>{messages.SUNDAY}</th>
                    <th>{messages.MONDAY}</th>
                    <th>{messages.TUESDAY}</th>
                    <th>{messages.WEDNESDAY}</th>
                    <th>{messages.THURSDAY}</th>
                    <th>{messages.FRIDAY}</th>
                    <th>{messages.SATURDAY}</th>
                </tr>
                </thead>
                <tbody>
                {shifts.map(shift => (
                    <tr key={shift.shift_id}>
                        <td className={`shift-${shift.shift_type} text-center fw-bold`}>
                            {shift.shift_name}<br/>
                            <small>{shift.start_time} ({shift.duration}h)</small>
                        </td>
                        {Array.from({length: 7}, (_, dayIndex) => renderCell(shift, dayIndex))}
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );
};

export default PositionScheduleEditor;