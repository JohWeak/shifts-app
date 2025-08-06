// frontend/src/features/admin-schedule-management/components/ScheduleEditor.js
import React, { useMemo, useState } from 'react';
import {format} from "date-fns";
import { Table, Button, Badge, Spinner, Form } from 'react-bootstrap';
import ScheduleCell from './ScheduleCell';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import {
    getWeekDates,
    formatShiftTime,
    formatHeaderDate,
    getDayName
} from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor, isDarkTheme } from 'shared/lib/utils/colorUtils';
import { useSelector } from "react-redux";
import { formatEmployeeName as formatEmployeeNameUtil } from 'shared/lib/utils/scheduleUtils'
import { useShiftColor } from 'shared/hooks/useShiftColor';
import './ScheduleEditor.css';



const ScheduleEditor = ({
                            position,
                            isEditing = false,
                            pendingChanges = {},
                            savingChanges = false,
                            canEdit = true,
                            onToggleEdit,
                            onSaveChanges,
                            selectedCell,
                            onCellClick,
                            onEmployeeClick,
                            onEmployeeRemove,
                            onRemovePendingChange,
                            scheduleDetails
                        }) => {
    const isMobile = useMediaQuery('(max-width: 1350px)');
    const {t} = useI18n();
    const { currentTheme } = useShiftColor();
    const isDark = isDarkTheme();
    const {systemSettings} = useSelector(state => state.settings);


    // Используем наш хук для управления цветами
    const {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        resetShiftColor
    } = useShiftColor();

    // Загружаем сохранённое состояние переключателя или используем true по умолчанию
    const [showFirstNameOnly, setShowFirstNameOnly] = useState(() => {
        const saved = localStorage.getItem('showFirstNameOnly');
        return saved !== null ? JSON.parse(saved) : true; // true по умолчанию
    });
    // Сохраняем при изменении
    const handleNameToggle = (checked) => {
        setShowFirstNameOnly(checked);
        localStorage.setItem('showFirstNameOnly', JSON.stringify(checked));
    };

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


    // Helper function to format date for header
    const weekDates = useMemo(() => {
        if (!scheduleDetails?.schedule?.start_date) return [];
        return getWeekDates(scheduleDetails.schedule.start_date, systemSettings?.weekStartDay || 0);
    }, [scheduleDetails?.schedule?.start_date, systemSettings?.weekStartDay]);


    // Debug logging
    console.log('Full scheduleDetails structure:', {
        schedule: scheduleDetails?.schedule,
        positions: scheduleDetails?.positions,
        assignments: scheduleDetails?.assignments,
        employees: scheduleDetails?.employees,
        shifts: scheduleDetails?.shifts
    });
    console.log('ScheduleEditor - Employees:', employees);

    // Function for formatting a name
    const formatEmployeeName = (employee) => {
        // Find all employees in the current position.
        const employeesInPosition = employees.filter(emp =>
            emp.default_position_id === position.pos_id ||
            assignments.some(a => a.emp_id === emp.emp_id && a.position_id === position.pos_id)
        );

        // We call the utility with the necessary options.
        return formatEmployeeNameUtil(employee, {
            showFullName: !showFirstNameOnly,
            checkDuplicates: true,
            contextEmployees: employeesInPosition
        });
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
                selectedCell={selectedCell}
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
                formatEmployeeName={formatEmployeeName}
                shiftColor={shift.color}
            />
        );
    };

    // Calculate total pending changes for this position
    const positionPendingChanges = Object.values(pendingChanges).filter(
        change => change.positionId === position.pos_id
    );


    return (
        <div className="position-schedule-editor">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="mb-1">{position.pos_name}</h6>
                    <small className="text-muted">
                        {t('employee.requiredEmployees')}: {position.num_of_emp || 0}
                        <Form.Check
                            type="switch"
                            id={`name-switch-${position.pos_id}`}
                            label={t('employee.showFirstNameOnly')}
                            className="ms-3 d-inline-block"
                            checked={showFirstNameOnly}
                            onChange={(e) => handleNameToggle(e.target.checked)}
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
                    <th className="text-center shift-header">{t('schedule.shift')}</th>
                    {weekDates.map((date, index) => {
                        const dayIndex = date.getDay();
                        const dayName = getDayName(dayIndex, t, isMobile);
                        const formattedDate = formatHeaderDate(date, isMobile);

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
                    shifts.map(shift => {
                        const currentColor = getShiftColor(shift);
                        const textColor = getContrastTextColor(currentColor, isDark);
                        return (
                            <tr key={shift.shift_id} style={{backgroundColor: `${currentColor}` || 'transparent'}}>
                                <td
                                    className='text-center shift-name-cell'
                                    style={{
                                        backgroundColor: currentColor || '#f8f9fa',
                                        color: textColor,
                                        position: 'relative'
                                    }}
                                >
                                    <div className="shift-info">
                                        <div className="shift-name">
                                            {shift.shift_name}
                                        </div>
                                        <div className="shift-time" style={{ color: textColor }}>
                                            {formatShiftTime(shift.start_time, shift.duration)}
                                        </div>
                                    </div>
                                    {/* Кнопка редактирования цвета */}
                                    {canEdit && (
                                        <button
                                            className="btn btn-sm shift-color-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openColorPicker(
                                                    shift.shift_id,
                                                    currentColor,
                                                    shift // передаем объект смены
                                                );
                                            }}
                                            title={t('shift.editColor')}
                                        >
                                            <i className="bi bi-palette-fill"></i>
                                        </button>
                                    )}
                                </td>
                                {Array.from({length: 7}, (_, dayIndex) => renderCell(shift, dayIndex))}
                            </tr>
                        );
                    })) : (

                    <tr>
                        <td colSpan="8" className="text-center text-muted py-3">
                            {t('schedule.noShiftsDefined')}
                        </td>
                    </tr>
                )
                }
                </tbody>
            </Table>

            {/* Edit Mode Message */}
            {
                isEditing && (
                    <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-pencil me-2"></i>
                        <strong>{t('position.editPosition')}: {position.pos_name}.</strong> {t('employee.clickToAssignEmployee')}
                    </div>
                )
            }

            <ColorPickerModal
                show={colorPickerState.show}
                onHide={closeColorPicker}
                onColorSelect={applyColor}
                onColorChange={previewColor}
                initialColor={colorPickerState.currentColor}
                title={t('modal.colorPicker.title')}
                saveMode={colorPickerState.saveMode}
                currentTheme={currentTheme}
                hasLocalColor={colorPickerState.hasLocalColor}
                originalGlobalColor={colorPickerState.originalGlobalColor}
                onResetColor={() => {
                    resetShiftColor(colorPickerState.shiftId);
                }}
            />
        </div>

    );
};

export default ScheduleEditor;