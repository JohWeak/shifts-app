// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleEditor.js
import React, {useMemo, useState} from 'react';
import {format} from "date-fns";
import {Table, Button, Badge, Spinner, Form, Tooltip, OverlayTrigger} from 'react-bootstrap';
import ScheduleCell from './ScheduleCell';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useMediaQuery} from 'shared/hooks/useMediaQuery';
import {
    getWeekDates,
    formatShiftTime,
    formatHeaderDate,
    getDayName
} from 'shared/lib/utils/scheduleUtils';
import {getContrastTextColor, isDarkTheme} from 'shared/lib/utils/colorUtils';
import {useSelector} from "react-redux";
import {formatEmployeeName as formatEmployeeNameUtil, canEditSchedule} from 'shared/lib/utils/scheduleUtils';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import { useEmployeeHighlight } from '../../model/hooks/useEmployeeHighlight';
import {useShiftColor} from 'shared/hooks/useShiftColor';
import { useDragAndDrop } from '../../model/hooks/useDragAndDrop';
import { useDispatch } from 'react-redux';
import { addPendingChange, removePendingChange } from '../../model/scheduleSlice';
import './ScheduleEditor.css';
import {addNotification} from "../../../../app/model/notificationsSlice";

const ScheduleEditor = ({
                            position,
                            schedule,
                            isEditing = false,
                            pendingChanges = {},
                            savingChanges = false,
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
    const {currentTheme} = useShiftColor();
    const isDark = isDarkTheme();
    const dispatch = useDispatch();
    const {
        highlightedEmployeeId,
        handleMouseEnter,
        handleMouseLeave
    } = useEmployeeHighlight();
    const {systemSettings} = useSelector(state => state.settings);
    const canEdit = canEditSchedule(schedule);
    const isPublished = schedule?.status === 'published';

    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

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
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Extract data from scheduleDetails
    const assignments = useMemo(() => {
        if (!scheduleDetails?.assignments) return [];
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
        // Use position's own shifts if available
        if (position.shifts && position.shifts.length > 0) {
            return position.shifts;
        }
        // Otherwise use shifts from scheduleDetails (filtered for this position if needed)
        if (scheduleDetails?.shifts) {
            return scheduleDetails.shifts.filter(s =>
                !s.position_id || s.position_id === position.pos_id
            );
        }
        return defaultShifts;
    }, [position.shifts, scheduleDetails?.shifts, position.pos_id, defaultShifts]);

    // Calculate total pending changes for this position
    const positionPendingChanges = useMemo(() => {
        return Object.values(pendingChanges).filter(
            change => change.positionId === position.pos_id
        );
    }, [pendingChanges, position.pos_id]);

    // Calculate current total assignments (including pending changes)
    const currentStats = useMemo(() => {
        let currentAssignments = assignments.length;
        let addedCount = 0;
        let removedCount = 0;

        positionPendingChanges.forEach(change => {
            if (change.action === 'assign') {
                addedCount++;
            } else if (change.action === 'remove') {
                removedCount++;
            } else if (change.action === 'replace') {
                addedCount++;
                if (change.employeeIdToReplace) {
                    removedCount++;
                }
            }
        });

        const totalCurrent = currentAssignments + addedCount - removedCount;

        return {
            current: currentAssignments,
            afterChanges: totalCurrent,
            added: addedCount,
            removed: removedCount
        };
    }, [assignments.length, positionPendingChanges]);

    // Get total required assignments for the position
    const totalRequired = useMemo(() => {
        if (position.total_required_assignments) {
            return position.total_required_assignments;
        }

        // Fallback calculation
        let total = 0;

        if (position.shift_requirements) {
            // If we have detailed requirements per shift/day
            Object.entries(position.shift_requirements).forEach(([shiftId, requirements]) => {
                if (typeof requirements === 'object') {
                    // Sum up daily requirements
                    Object.values(requirements).forEach(dayReq => {
                        total += (dayReq || 1);
                    });
                } else {
                    // Simple requirement for all days
                    total += (requirements * 7);
                }
            });
        } else {
            // Default calculation
            const numShifts = shifts.length || 1;
            const daysInWeek = 7;
            const defaultStaff = position.num_of_emp || 1;
            total = numShifts * daysInWeek * defaultStaff;
        }

        return total;
    }, [position, shifts]);

    const shortage = totalRequired - currentStats.afterChanges;

    // Count unique employees (including pending)
    const uniqueEmployees = useMemo(() => {
        const unique = new Set();
        assignments.forEach(a => {
            if (a.emp_id) unique.add(a.emp_id);
        });

        // Add pending assignments
        positionPendingChanges.forEach(change => {
            if ((change.action === 'assign' || change.action === 'replace') && change.empId) {
                unique.add(change.empId);
            }
            if (change.action === 'remove' && change.empId) {
                unique.delete(change.empId);
            }
        });

        return unique.size;
    }, [assignments, positionPendingChanges]);

    const dnd = useDragAndDrop(isEditing, pendingChanges, assignments);
    const handleDrop = (targetCell, targetEmployee = null) => {

        console.log('handleDrop called:', { targetCell, targetEmployee });
        const changesToApply = dnd.createChangesOnDrop(targetCell, targetEmployee);
        console.log('Changes to apply:', changesToApply);
        // Проверяем на ошибки
        const hasError = changesToApply.some(item => item.action === 'error');

        if (hasError) {
            // Показываем уведомление об ошибке
            const errorItem = changesToApply.find(item => item.action === 'error');
            console.error('Drop cancelled:', errorItem.message)
            dispatch(addNotification({
                type: 'warning',
                message: errorItem.message || 'Cannot complete this operation'
            }));
            return;
        }

        // Если нет ошибок - применяем изменения
        changesToApply.forEach(item => {
            console.log('Applying change:', item);
            if (item.action === 'removePending') {
                dispatch(removePendingChange(item.pendingKey));
            }
            else if (item.change) {
                dispatch(addPendingChange(item));
            }
        });
    };

    // Получаем требования для конкретной смены
    const getRequiredEmployeesForShift = (shiftId, dayIndex) => {
        // Если есть требования по дням
        if (position.shift_requirements && position.shift_requirements[shiftId]) {
            const requirements = position.shift_requirements[shiftId];

            // Если это объект с днями недели
            if (typeof requirements === 'object' && !Array.isArray(requirements)) {
                return requirements[dayIndex] || 0;
            }

            // Если это просто число (старый формат)
            if (typeof requirements === 'number') {
                return requirements;
            }
        }

        // Fallback на старую логику
        const shift = shifts.find(s => s.shift_id === shiftId || s.id === shiftId);
        if (shift && shift.required_staff) {
            return shift.required_staff;
        }

        return 0;
    };

    // Handle save with confirmation if shortage/overage
    const handleSaveClick = () => {
        if (shortage !== 0) {
            setShowSaveConfirmation(true);
        } else {
            onSaveChanges(position.pos_id);
        }
    };

    const handleSaveConfirm = () => {
        setShowSaveConfirmation(false);
        onSaveChanges(position.pos_id);
    };

    // Сохраняем при изменении
    const handleNameToggle = (checked) => {
        setShowFirstNameOnly(checked);
        localStorage.setItem('showFirstNameOnly', JSON.stringify(checked));
    };

    // Helper function to format date for header
    const weekDates = useMemo(() => {
        if (!scheduleDetails?.schedule?.start_date) return [];
        return getWeekDates(scheduleDetails.schedule.start_date, systemSettings?.weekStartDay || 0);
    }, [scheduleDetails?.schedule?.start_date, systemSettings?.weekStartDay]);

    // Function for formatting a name
    const formatEmployeeName = (employee) => {
        const employeesInPosition = employees.filter(emp =>
            emp.default_position_id === position.pos_id ||
            assignments.some(a => a.emp_id === emp.emp_id && a.position_id === position.pos_id)
        );

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

    const renderCell = (shift, dayIndex) => {
        const date = weekDates[dayIndex];
        const dateStr = format(date, 'yyyy-MM-dd');

        // Find assignments for this position, shift and date
        const cellAssignments = assignments.filter(assignment => {
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
                    assignment_id: assignment.id,
                    employee_name: employee.name || `${employee.first_name} ${employee.last_name}`
                };
            }

            return {
                emp_id: assignment.emp_id,
                first_name: assignment.first_name || assignment.employee.first_name || '',
                last_name: assignment.last_name || assignment.employee.last_name || '',
                employee_name: assignment.employee_name ||
                    (assignment.employee.first_name && assignment.employee.last_name ?
                        `${assignment.employee.first_name} ${assignment.employee.last_name}` :
                        'Unknown Employee'),
                assignment_id: assignment.id
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
                requiredEmployees={getRequiredEmployeesForShift(shift.shift_id, dayIndex)}
                onCellClick={onCellClick}
                onEmployeeClick={onEmployeeClick}
                onRemoveEmployee={(date, posId, shiftId, empId, assignmentId) =>
                    onEmployeeRemove(date, posId, shiftId, empId, assignmentId)}
                onRemovePendingChange={onRemovePendingChange}
                pendingChanges={pendingChanges}
                formatEmployeeName={formatEmployeeName}
                shiftColor={shift.color}
                dnd={dnd}
                onDrop={handleDrop}
                highlightedEmployeeId={highlightedEmployeeId}
                onEmployeeMouseEnter={handleMouseEnter}
                onEmployeeMouseLeave={handleMouseLeave}
            />
        );
    };

    const renderEditTooltip = (props) => (
        <Tooltip id="edit-disabled-tooltip" {...props}>
            {isPublished
                ? t('schedule.unpublishToEdit')
                : t('schedule.cannotEditStatus')}
        </Tooltip>
    );

    return (
        <div className="position-schedule-editor mb-2">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="mb-1">{position.pos_name}</h6>
                    <div className="d-flex align-items-center gap-2">
                        <Form.Check
                            type="switch"
                            id={`name-switch-${position.pos_id}`}
                            label={t('employee.showFirstNameOnly')}
                            className="d-inline-block text-muted"
                            checked={showFirstNameOnly}
                            onChange={(e) => handleNameToggle(e.target.checked)}
                        />

                        {/* Live statistics badges */}
                        <Badge bg={shortage === 0 ? 'success' : shortage > 0 ? 'danger' : 'warning'}>
                            {t('schedule.assignments')}: {currentStats.afterChanges}/{totalRequired}
                        </Badge>

                        {positionPendingChanges.length > 0 && (
                            <Badge bg="info">
                                {t('schedule.pending')}: {positionPendingChanges.length}
                            </Badge>
                        )}

                        {shortage !== 0 && (
                            <Badge bg={shortage > 0 ? 'danger' : 'warning'}>
                                {shortage > 0
                                    ? `↓ ${shortage}`
                                    : `↑ ${Math.abs(shortage)}`}
                            </Badge>
                        )}
                    </div>
                </div>
                <div>
                    {/* Edit button */}
                    {!isEditing && (
                        <>
                            {!canEdit ? (
                                <OverlayTrigger
                                    placement="top"
                                    delay={{show: 250, hide: 400}}
                                    overlay={renderEditTooltip}
                                >
                                    <span className="d-inline-block">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            disabled
                                            style={{pointerEvents: 'none'}}
                                        >
                                            <i className="bi bi-pencil me-1"></i>
                                            {t('common.edit')}
                                        </Button>
                                    </span>
                                </OverlayTrigger>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => onToggleEdit(position.pos_id)}
                                >
                                    <i className="bi bi-pencil me-1"></i>
                                    {t('common.edit')}
                                </Button>
                            )}
                        </>
                    )}

                    {/* Save/Cancel buttons */}
                    {isEditing && (
                        <>
                            <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={handleSaveClick}
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
                                onClick={() => onToggleEdit(position.pos_id)}
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
                                        <div className="shift-time" style={{color: textColor}}>
                                            {formatShiftTime(shift.start_time, shift.end_time)}
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <button
                                            className="btn btn-sm shift-color-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openColorPicker(
                                                    shift.shift_id,
                                                    currentColor,
                                                    shift
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
                )}
                </tbody>
            </Table>

            {/* Edit Mode Statistics */}
            {isEditing && (
                <div className="position-stats mt-2 p-2 rounded">
                    <div className="row">
                        <div className="col-md-6">
                            <small className="d-block">
                                <strong>{t('schedule.currentStatus')}:</strong>
                            </small>
                            <small className="d-block text-muted">
                                {t('schedule.totalRequired')}: {totalRequired}
                            </small>
                            <small className="d-block text-muted">
                                {t('schedule.currentAssignments')}: {currentStats.current}
                            </small>
                            {currentStats.added > 0 && (
                                <small className="d-block text-success">
                                    {t('schedule.toBeAdded')}: +{currentStats.added}
                                </small>
                            )}
                            {currentStats.removed > 0 && (
                                <small className="d-block text-danger">
                                    {t('schedule.toBeRemoved')}: -{currentStats.removed}
                                </small>
                            )}
                        </div>
                        <div className="col-md-6">
                            <small className="d-block">
                                <strong>{t('schedule.afterSave')}:</strong>
                            </small>
                            <small className={`d-block ${shortage === 0 ? 'text-success' : shortage > 0 ? 'text-danger' : 'text-warning'}`}>
                                <strong>{currentStats.afterChanges}/{totalRequired}</strong>
                            </small>
                            {shortage !== 0 && (
                                <small className={`d-block fw-bold ${shortage > 0 ? 'text-danger' : 'text-warning'}`}>
                                    <i className={`bi ${shortage > 0 ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-1`}></i>
                                    {shortage > 0
                                        ? t('schedule.assignmentsShortage', { count: shortage })
                                        : t('schedule.assignmentsOverage', { count: Math.abs(shortage) })
                                    }
                                </small>
                            )}
                            <small className="d-block text-muted">
                                {t('schedule.uniqueEmployees')}: {uniqueEmployees}
                            </small>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Save Confirmation Modal */}
            <ConfirmationModal
                show={showSaveConfirmation}
                onHide={() => setShowSaveConfirmation(false)}
                onConfirm={handleSaveConfirm}
                title={t('schedule.saveChanges')}
                message={
                    shortage > 0
                        ? t('schedule.confirmSaveWithShortage', { count: shortage })
                        : t('schedule.confirmSaveWithOverage', { count: Math.abs(shortage) })
                }
                confirmText={t('common.save')}
                confirmVariant="warning"
                loading={savingChanges}
            >
                <div className="alert alert-info">
                    <strong>{t('schedule.currentStatus')}:</strong>
                    <ul className="mb-0 mt-2">
                        <li>{t('schedule.totalRequired')}: {totalRequired}</li>
                        <li>{t('schedule.currentAssignments')}: {currentStats.currentAssignments}</li>
                        {currentStats.added > 0 && (
                            <li className="text-success">
                                {t('schedule.toBeAdded')}: +{currentStats.added}
                            </li>
                        )}
                        {currentStats.removed > 0 && (
                            <li className="text-danger">
                                {t('schedule.toBeRemoved')}: -{currentStats.removed}
                            </li>
                        )}
                        <li>
                            <strong>
                                {t('schedule.afterSave')}: {currentStats.afterChanges}/{totalRequired}
                            </strong>
                        </li>
                    </ul>
                </div>
            </ConfirmationModal>
        </div>
    );
};

export default ScheduleEditor;