// frontend/src/features/admin-schedule-management/components/ScheduleEditor.js
import React, {useMemo, useState} from 'react';
import {Table, Button, Badge, Spinner, Form} from 'react-bootstrap';
import ScheduleCell from './ScheduleCell';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {getWeekDates} from 'shared/lib/utils/scheduleUtils';
import {useSelector} from "react-redux";
import {format} from "date-fns";
import './ScheduleEditor.css';

const ScheduleEditor = ({
                            position,
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
    const {t} = useI18n();
    const {systemSettings} = useSelector(state => state.settings);


    // Extract data from scheduleDetails
    const assignments = useMemo(() => {
        if (!scheduleDetails?.assignments) return [];

        // Filter assignments for this position
        // Handle both pos_id and position_id field names
        return scheduleDetails.assignments.filter(a => {
            const assignmentPosId = a.pos_id || a.position_id;
            return assignmentPosId === position.pos_id;
        });
    }, [position.pos_id, scheduleDetails?.assignments]);


    const employees = useMemo(() => {
        return scheduleDetails?.employees || [];
    }, [scheduleDetails?.employees]);

    // Define default shifts if not provided
    const defaultShifts = useMemo(() => [
        {shift_id: 1, shift_name: 'Morning', shift_type: 'morning', start_time: '06:00:00', duration: 8},
        {shift_id: 2, shift_name: 'Day', shift_type: 'day', start_time: '14:00:00', duration: 8},
        {shift_id: 3, shift_name: 'Night', shift_type: 'night', start_time: '22:00:00', duration: 8}
    ], []);

    const shifts = useMemo(() => {
        return scheduleDetails?.shifts || position?.shifts || defaultShifts;
    }, [defaultShifts, scheduleDetails?.shifts, position?.shifts]);

    // Helper function to format shift time
    const formatShiftTime = (startTime, duration) => {
        if (!startTime) return '';

        const cleanStart = startTime.substring(0, 5);
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + (duration * 60);

        const endHours = Math.floor(endMinutes / 60) % 24;
        const endMins = endMinutes % 60;
        const cleanEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        return `${cleanStart}-${cleanEnd}`;
    };

    // Helper function to format date for header
    const weekDates = useMemo(() => {
        if (!scheduleDetails?.schedule?.start_date) return [];
        return getWeekDates(scheduleDetails.schedule.start_date, systemSettings?.weekStartDay || 0);
    }, [scheduleDetails?.schedule?.start_date, systemSettings?.weekStartDay]);

    // Helper function to get day name
    const getDayName = (dayIndex) => {
        const dayNames = [
            t('days.sunday'),
            t('days.monday'),
            t('days.tuesday'),
            t('days.wednesday'),
            t('days.thursday'),
            t('days.friday'),
            t('days.saturday')
        ];
        return dayNames[dayIndex];
    };

    // Debug logging
    console.log('ScheduleEditor - Position:', position);
    console.log('ScheduleEditor - Schedule Details:', scheduleDetails);
    console.log('ScheduleEditor - Shifts:', shifts);
    console.log('ScheduleEditor - Assignments:', assignments);
    console.log('Full scheduleDetails structure:', {
        schedule: scheduleDetails?.schedule,
        positions: scheduleDetails?.positions,
        assignments: scheduleDetails?.assignments,
        employees: scheduleDetails?.employees,
        shifts: scheduleDetails?.shifts
    });
    console.log('ScheduleEditor - Employees:', employees);

    const [showFirstNameOnly, setShowFirstNameOnly] = useState(false);

    // Функция для форматирования имени
    const formatEmployeeName = (employee) => {
        if (!showFirstNameOnly) {
            return employee.employee_name || `${employee.first_name} ${employee.last_name}`;
        }

        const firstName = employee.first_name || employee.employee_name?.split(' ')[0] || '';

        // Проверяем, есть ли дубликаты имени в этой позиции
        const employeesInPosition = employees.filter(emp =>
            emp.default_position_id === position.pos_id ||
            assignments.some(a => a.emp_id === emp.emp_id && a.position_id === position.pos_id)
        );

        const duplicateNames = employeesInPosition.filter(emp =>
            (emp.first_name || emp.employee_name?.split(' ')[0]) === firstName
        );

        if (duplicateNames.length > 1) {
            const lastName = employee.last_name || employee.employee_name?.split(' ')[1] || '';
            return `${firstName} ${lastName.charAt(0)}.`;
        }

        return firstName;
    };


    if (!position) {
        return (
            <div className="alert alert-warning">
                {t('errors.positionDataMissing')}
            </div>
        );
    }

    if (!scheduleDetails) {
        return (
            <div className="alert alert-warning">
                {t('errors.scheduleDetailsMissing')}
            </div>
        );
    }

    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    const renderCell = (shift, dayIndex) => {
        const date = weekDates[dayIndex];
        const dateStr = format(date, 'yyyy-MM-dd');


        // Find assignments for this position, shift and date
        const cellAssignments = assignments.filter(assignment => {
            // Check different possible field names
            const assignmentPosId = assignment.pos_id || assignment.position_id;
            const assignmentDate = assignment.work_date || assignment.date;

            return assignmentPosId === position.pos_id &&
                assignment.shift_id === shift.shift_id &&
                assignmentDate === dateStr;
        });

        // Get employees for assignments
        const cellEmployees = cellAssignments.map(assignment => {
            const employee = employees.find(emp => emp.emp_id === assignment.emp_id);
            if (employee) {
                return {
                    ...employee,
                    assignment_id: assignment.id, // Это уже есть
                    employee_name: employee.name || `${employee.first_name} ${employee.last_name}`
                };
            }

            // If employee not found, use data from assignment
            return {
                emp_id: assignment.emp_id,
                employee_name: assignment.employee_name || 'Unknown Employee',
                assignment_id: assignment.id // Убедитесь что это тоже есть
            };
        }).filter(Boolean);

        // Check pending changes
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

        const currentEmployees = cellEmployees.length - pendingRemovals.length;
        const totalEmployees = currentEmployees + pendingAssignments.length;
        const isUnderstaffed = totalEmployees < position.num_of_emp;

        return (
            <ScheduleCell
                key={`${shift.shift_id}-${dayIndex}`}
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
                onRemoveEmployee={(date, posId, shiftId, empId, assignmentId) =>
                    onEmployeeRemove(date, posId, shiftId, empId, assignmentId)}
                onRemovePendingChange={onRemovePendingChange}
                pendingChanges={pendingChanges}
            />
        );
    };

    // Calculate total pending changes for this position
    const positionPendingChanges = Object.values(pendingChanges).filter(
        change => change.positionId === position.pos_id
    );

    return (
        <div className="position-schedule-editor mb-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="mb-1">{position.pos_name}</h6>
                    <small className="text-muted">
                        {t('employee.requiredEmployees')}: {position.num_of_emp}
                        <Form.Check
                            type="switch"
                            id={`name-switch-${position.pos_id}`}
                            label={t('employee.showFirstNameOnly')}
                            className="me-3 d-inline-block"
                            checked={showFirstNameOnly}
                            onChange={(e) => setShowFirstNameOnly(e.target.checked)}
                        />
                        {hasPendingChanges && positionPendingChanges.length > 0 && (
                            <Badge bg="warning" className="ms-2">
                                {t('position.unsavedChanges')} ({positionPendingChanges.length})
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
                                if (onToggleEdit) {
                                    onToggleEdit(position.pos_id);
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
                                    if (onSaveChanges) {
                                        onSaveChanges(position.pos_id);
                                    }
                                }}
                                disabled={savingChanges || positionPendingChanges.length === 0}
                            >
                                {savingChanges ? (
                                    <>
                                        <Spinner size="sm" className="me-1"/>
                                        {t('common.saving')}
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
            <Table responsive bordered className="schedule-table mb-0">
                <thead>
                <tr>
                    <th className="shift-header">{t('schedule.shift')}</th>
                    {weekDates.map((date, index) => {
                        const dayIndex = date.getDay();
                        const dayName = getDayName(dayIndex);
                        const formattedDate = format(date, 'dd/MM');

                        return (
                            <th key={index} className="text-center">
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
                {shifts.length > 0 ? (
                    shifts.map(shift => (
                        <tr key={shift.shift_id}>
                            <td className={`shift-${shift.shift_type} text-center`}>
                                <div>
                                    {shift.shift_name}<br/>
                                    <small className="text-muted">
                                        {formatShiftTime(shift.start_time, shift.duration)}
                                    </small>
                                </div>
                            </td>
                            {Array.from({length: 7}, (_, dayIndex) => renderCell(shift, dayIndex))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="8" className="text-center text-muted py-3">
                            {t('schedule.noShiftsDefined')}
                        </td>
                    </tr>
                )}
                </tbody>
            </Table>

            {/* Edit Mode Message */}
            {isEditing && (
                <div className="alert alert-info mt-3">
                    <i className="bi bi-pencil me-2"></i>
                    <strong>{t('position.editPosition')}: {position.pos_name}.</strong> {t('employee.clickToAssignEmployee')}
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;