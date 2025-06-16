// frontend/src/CompareAlgorithmsModal.js/admin/schedule/PositionScheduleEditor.js
import React from 'react';
import { Table, Button, Badge, Spinner } from 'react-bootstrap';
import ScheduleCell from './ScheduleCell';
import {  interpolateMessage } from '../../../shared/lib/i18n/messages';
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';

const PositionScheduleEditor = ({
                                    position,
                                    assignments = [],
                                    employees = [],
                                    shifts = [],
                                    isEditing = false,
                                    pendingChanges = {},
                                    savingChanges = false,
                                    canEdit = true,
                                    onToggleEdit,
                                    onSaveChanges,
                                    onCellClick,
                                    onEmployeeClick,
                                    onEmployeeRemove,
                                    onRemovePendingChange,
                                    scheduleDetails
                                }) => {
    const { t } = useI18n();

    // Helper function to format shift time without seconds and duration
    const formatShiftTime = (startTime, duration) => {
        // Remove seconds from time format
        const cleanStart = startTime.substring(0, 5); // 14:00:00 -> 14:00

        // Calculate end time
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + (duration * 60);

        const endHours = Math.floor(endMinutes / 60) % 24;
        const endMins = endMinutes % 60;

        const cleanEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        return `${cleanStart}-${cleanEnd}`;
    };

    // Helper function to format date for header
    const formatDateForHeader = (dateStr, dayName) => {
        const date = new Date(dateStr);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
        return formattedDate;
    };

    // Helper function to get day name
    const getDayName = (dayIndex) => {
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return dayNames[dayIndex];
    };

    // Debug logging
    console.log('PositionScheduleEditor props:', {
        positionId: position?.pos_id,
        positionName: position?.pos_name,
        isEditing,
        canEdit,
        hasOnToggleEdit: !!onToggleEdit,
        pendingChangesCount: Object.keys(pendingChanges).length,
        pendingChanges: pendingChanges
    });
    console.log('Position:', position);
    console.log('Schedule Details:', scheduleDetails);


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

        // Find assignments for this position, shift and date
        const cellAssignments = assignments.filter(assignment =>
            assignment.position_id === position.pos_id &&
            assignment.shift_id === shift.shift_id &&
            assignment.work_date === dateStr
        );

        console.log('Assignment for', dateStr, shift.shift_name, ':', cellAssignments);


        // Get employees for assignments
        const cellEmployees = cellAssignments.map(assignment => {
            const employee = employees.find(emp => emp.emp_id === assignment.emp_id);
            return employee ? { ...employee, assignment_id: assignment.id } : null;
        }).filter(Boolean);

        // Check pending changes - фильтруем для этой конкретной ячейки
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

        // Логирование для отладки
        if (pendingAssignments.length > 0 || pendingRemovals.length > 0) {
            console.log(`Cell [${shift.shift_name}][${dateStr}] pending changes:`, {
                assignments: pendingAssignments,
                removals: pendingRemovals
            });
        }

        const currentEmployees = cellEmployees.length - pendingRemovals.length;
        const totalEmployees = currentEmployees + pendingAssignments.length;
        const isUnderstaffed = totalEmployees < position.num_of_emp;

        console.log('Rendering cell with onRemoveEmployee:', !!onEmployeeRemove);

        return (
            <ScheduleCell
                key={dayIndex}
                date={dateStr}
                positionId={position.pos_id}
                shiftId={shift.shift_id}
                employees={cellEmployees}
                pendingAssignments={pendingAssignments}
                pendingRemovals={pendingRemovals}
                isEditing={isEditing}
                isUnderstaffed={isUnderstaffed}
                requiredEmployees={position.num_of_emp}
                onCellClick={onCellClick}
                onEmployeeClick={onEmployeeClick}
                onRemoveEmployee={onEmployeeRemove}
            />
        );
    };

    return (
        <div className="position-schedule-editor mb-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="mb-1">{position.pos_name}</h6>
                    <small className="text-muted">
                        {interpolateMessage(t('employee.required'), {
                            count: position.num_of_emp
                        })}
                        {hasPendingChanges && (
                            <Badge bg="warning" className="ms-2">
                                {t('position.unsavedChanges')} ({Object.keys(pendingChanges).length})
                            </Badge>
                        )}
                    </small>
                </div>
                <div>
                    {/* Edit button */}
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
                            {t('common.edit')}
                        </Button>
                    )}

                    {/* Save/Cancel buttons */}
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
                                        {t('common.save')}
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
                                {t('common.cancel')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Schedule Table */}
            <Table responsive bordered size="sm" className="schedule-table">
                <thead>
                <tr>
                    <th className="shift-header">Shift</th>
                    {Array.from({length: 7}, (_, dayIndex) => {
                        const date = new Date(scheduleDetails.schedule.start_date);
                        date.setDate(date.getDate() + dayIndex);
                        const dateStr = date.toISOString().split('T')[0];
                        const dayName = getDayName(dayIndex);
                        const formattedDate = formatDateForHeader(dateStr, dayName);

                        return (
                            <th key={dayIndex} className="text-center">
                                <div>
                                    <strong>{dayName}</strong><br/>
                                    <small>{formattedDate}</small>
                                </div>
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {shifts.map(shift => (
                    <tr key={shift.shift_id}>
                        <td className={`shift-${shift.shift_type} text-center`}>
                            <div>
                                {shift.shift_name}<br/>
                                <small>{formatShiftTime(shift.start_time, shift.duration)}</small>
                            </div>
                        </td>
                        {Array.from({length: 7}, (_, dayIndex) => renderCell(shift, dayIndex))}
                    </tr>
                ))}
                </tbody>
            </Table>

            {/* Edit Mode Message */}
            {isEditing && (
                <div className="alert alert-info mt-3">
                    <i className="bi bi-pencil me-2"></i>
                    <strong>{t('common.editModeFor')} {position.pos_name}.</strong> {t('Click to assign employee')}
                </div>
            )}
        </div>
    );
};

export default PositionScheduleEditor;