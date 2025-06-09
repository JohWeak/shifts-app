// frontend/src/components/admin/schedule/PositionScheduleEditor.js
import React from 'react';
import { Table, Badge, Button, Spinner } from 'react-bootstrap';
import {interpolateMessage, useMessages} from '../../../i18n/messages';

const PositionScheduleEditor = ({
                                    positionId,
                                    positionData,
                                    scheduleDetails,
                                    isEditing,
                                    pendingChanges,
                                    savingChanges,
                                    onToggleEdit,
                                    onSaveChanges,
                                    onCellClick,
                                    onEmployeeRemove,
                                    onRemovePendingChange,
                                    readOnly = false
                                }) => {
    const messages = useMessages('en');
    const hasPendingChanges = Object.values(pendingChanges).some(
        change => change.positionId === positionId
    );

    const renderCell = (shift, dayIndex) => {
        const date = new Date(scheduleDetails.schedule.start_date);
        date.setDate(date.getDate() + dayIndex);
        const dateStr = date.toISOString().split('T')[0];

        const cellData = positionData.schedule?.[dateStr]?.[shift.shift_id];
        const assignments = cellData?.assignments || [];

        // Check for pending changes
        const pendingAssignments = Object.values(pendingChanges).filter(change =>
            change.action === 'assign' &&
            change.positionId === positionId &&
            change.date === dateStr &&
            change.shiftId === shift.shift_id
        );

        const pendingRemovals = Object.values(pendingChanges).filter(change =>
            change.action === 'remove' &&
            change.positionId === positionId &&
            change.date === dateStr &&
            change.shiftId === shift.shift_id
        );

        const currentAssignments = assignments.length - pendingRemovals.length;
        const totalAssignments = currentAssignments + pendingAssignments.length;
        const isEmpty = totalAssignments === 0;
        const isUnderstaffed = totalAssignments < positionData.position.num_of_emp;

        return (
            <td
                key={dayIndex}
                className={`text-center ${isEditing ? 'position-relative' : ''} ${isEmpty && isEditing ? 'table-warning' : ''}`}
                style={{
                    cursor: isEditing ? 'pointer' : 'default',
                    minHeight: '60px',
                    verticalAlign: 'middle'
                }}
                onClick={() => isEditing && onCellClick(positionId, dateStr, shift.shift_id)}
            >
                <div>
                    {/* Current assignments */}
                    {assignments.map(assignment => {
                        const isBeingRemoved = pendingRemovals.some(
                            change => change.assignmentId === assignment.id
                        );

                        return (
                            <div
                                key={assignment.id}
                                className={`mb-1 ${isBeingRemoved ? 'text-decoration-line-through text-muted' : ''}`}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <span style={{ fontSize: '0.8rem' }}>
                                        {assignment.employee.name}
                                    </span>
                                    {isEditing && !isBeingRemoved && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEmployeeRemove(dateStr, shift.shift_id, positionId, assignment.id);
                                            }}
                                            style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                        >
                                            ×
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Pending new assignments */}
                    {pendingAssignments.map((change, index) => (
                        <div key={`pending-${index}`} className="mb-1">
                            <div className="d-flex justify-content-between align-items-center">
                                <span style={{ fontSize: '0.8rem' }} className="text-success">
                                    {change.empName}
                                </span>
                                <Badge bg="success" size="sm" className="me-1">
                                    {messages.NEW}
                                </Badge>
                                {isEditing && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const changeKey = `${positionId}-${dateStr}-${shift.shift_id}-add-${change.empId}`;
                                            onRemovePendingChange(changeKey);
                                        }}
                                        style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add employee button */}
                    {isEditing && isEmpty && (
                        <div className="text-muted">
                            <i className="bi bi-plus-circle"></i> {messages.ADD_EMPLOYEE}
                        </div>
                    )}

                    {/* Warning about understaffing */}
                    {isEditing && isUnderstaffed && !isEmpty && (
                        <div className="text-warning">
                            <small>
                                {interpolateMessage(messages.NEED_MORE_EMPLOYEES, {
                                    count: positionData.position.num_of_emp - totalAssignments
                                })}
                            </small>
                        </div>
                    )}
                </div>
            </td>
        );
    };

    return (
        <div className="mb-4">
            {/* Header with Edit/Save button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="text-primary mb-0">
                        {positionData.position.name} - {positionData.position.profession}
                        {hasPendingChanges && (
                            <Badge bg="warning" className="ms-2">
                                {messages.UNSAVED_CHANGES}
                            </Badge>
                        )}
                        {readOnly && (
                            <Badge bg="secondary" className="ms-2">
                                <i className="bi bi-lock me-1"></i>
                                Read-only
                            </Badge>
                        )}
                    </h6>
                    <small className="text-muted">
                        {interpolateMessage(messages.REQUIRED_EMPLOYEES, {
                            count: positionData.position.num_of_emp
                        })}
                    </small>
                </div>
                <div className="d-flex gap-2">
                    {!readOnly && ( // Скрыть кнопки в read-only режиме
                        !isEditing ? (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onToggleEdit(positionId)}
                                disabled={savingChanges}
                            >
                                <i className="bi bi-pencil me-1"></i>
                                {messages.EDIT}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => onSaveChanges(positionId)}
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
                                    onClick={() => onToggleEdit(positionId)}
                                    disabled={savingChanges}
                                >
                                    {messages.CANCEL}
                                </Button>
                            </>
                        )
                    )}
                </div>
            </div>

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
                {scheduleDetails.all_shifts?.map(shift => (
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