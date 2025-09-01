// frontend/src/features/admin-schedule-management/ui/ScheduleView/index.js
import React, {useState, useEffect, useMemo} from 'react';
import {format} from 'date-fns';
import {useDispatch} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useMediaQuery} from 'shared/hooks/useMediaQuery';
import {isDarkTheme} from 'shared/lib/utils/colorUtils';
import {canEditSchedule, formatEmployeeName as formatEmployeeNameUtil} from 'shared/lib/utils/scheduleUtils';
import {useShiftColor} from 'shared/hooks/useShiftColor';
import {useEmployeeHighlight} from '../../../../model/hooks/useEmployeeHighlight';
import {useDragAndDrop} from '../../../../model/hooks/useDragAndDrop';
import {useSpareShiftResize} from '../../../../model/hooks/useSpareShiftResize';
import {usePositionScheduleData} from './hooks/usePositionScheduleData';

import {addPendingChange, removePendingChange} from '../../../../model/scheduleSlice';
import {addNotification} from 'app/model/notificationsSlice';

import ScheduleCell from '../ScheduleCell';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import PositionScheduleHeader from './components/PositionScheduleHeader';
import PositionScheduleTable from './components/PositionScheduleTable';
import './PositionEditor.css';

const PositionEditor = ({
                            position,
                            schedule,
                            isEditing = false,
                            pendingChanges = {},
                            isSaving,
                            onToggleEdit,
                            onSaveChanges,
                            selectedCell,
                            onCellClick,
                            onEmployeeClick,
                            onEmployeeRemove,
                            onRemovePendingChange,
                            scheduleDetails,
                            onAutofill,
                            isAutofilling = false,
                            onCreateSpareShift = null,
                        }) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    // --- STATE & SETTINGS ---
    const isMobile = useMediaQuery('(max-width: 1350px)');
    const isDark = isDarkTheme();
    const canEdit = canEditSchedule(schedule);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [showFirstNameOnly, setShowFirstNameOnly] = useState(() => {
        const saved = localStorage.getItem('showFirstNameOnly');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // --- CUSTOM HOOKS ---
    const {
        weekDates,
        assignments,
        shifts,
        employees,
        positionPendingChanges,
        currentStats,
        totalRequired,
        shortage,
        uniqueEmployees,
    } = usePositionScheduleData(scheduleDetails, position, pendingChanges);

    const {
        currentTheme,
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        resetShiftColor,
    } = useShiftColor();
    const {highlightedEmployeeId, handleMouseEnter, handleMouseLeave} = useEmployeeHighlight();

    // Enhanced DnD with spare shift support
    const positions = scheduleDetails?.positions || [];
    const dnd = useDragAndDrop(isEditing, pendingChanges, assignments, positions, onCreateSpareShift);

    // State for stretched employees with DOM references
    const [stretchedEmployeesWithDOM, setStretchedEmployeesWithDOM] = useState([]);

    // Spare shift resize functionality
    const {handleResizeStart, tempTime, isResizing, resizeData} = useSpareShiftResize((resizeResult) => {
        // Handle spare shift resize completion
        console.log('🎯 Position received resize result:', resizeResult);

        // Update assignment with new custom times - use consistent key to replace existing
        const changeKey = `resize-${resizeResult.employee.empId}-${resizeResult.employee.assignmentId}`;
        dispatch(addPendingChange({
            key: changeKey,
            change: {
                action: 'assign',
                date: resizeResult.cellData.date,
                shiftId: resizeResult.cellData.shiftId,
                positionId: resizeResult.cellData.positionId,
                empId: resizeResult.employee.empId,
                assignmentId: resizeResult.employee.assignmentId,
                custom_start_time: resizeResult.newTimes.start_time,
                custom_end_time: resizeResult.newTimes.end_time,
                isResize: true // Flag to indicate this is a resize operation
            }
        }));

        dispatch(addNotification({
            variant: 'info',
            message: t('admin.schedule.spareShiftResized', {
                employee: resizeResult.employee.name,
                duration: resizeResult.newTimes.duration
            })
        }));
    });

    // --- HANDLERS ---
    const handleNameToggle = (checked) => {
        setShowFirstNameOnly(checked);
        localStorage.setItem('showFirstNameOnly', JSON.stringify(checked));
    };

    const handleAutofill = async () => {
        if (onAutofill) {
            await onAutofill(position);
        }
    };

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

    const handleDrop = (targetCell, targetEmployee = null) => {
        const changesToApply = dnd.createChangesOnDrop(targetCell, targetEmployee);
        const hasError = changesToApply.some(item => item.action === 'error');

        if (hasError) {
            const errorItem = changesToApply.find(item => item.action === 'error');
            dispatch(addNotification({
                type: 'warning',
                message: errorItem.message || 'Cannot complete this operation',
            }));
            return;
        }

        changesToApply.forEach(item => {
            if (item.action === 'removePending') {
                dispatch(removePendingChange(item.pendingKey));
            } else if (item.change) {
                dispatch(addPendingChange(item));
            }
        });
    };

    // --- RENDER LOGIC ---
    const formatEmployeeName = (employee) => {
        const employeesInPosition = employees.filter(emp =>
            emp.default_position_id === position.pos_id ||
            assignments.some(a => a.emp_id === emp.emp_id && a.position_id === position.pos_id),
        );
        return formatEmployeeNameUtil(employee, {
            showFullName: !showFirstNameOnly,
            checkDuplicates: true,
            contextEmployees: employeesInPosition,
        });
    };

    const getRequiredEmployeesForShift = (shiftId, dayIndex) => {
        if (position.shift_requirements && position.shift_requirements[shiftId]) {
            const requirements = position.shift_requirements[shiftId];
            if (typeof requirements === 'object' && !Array.isArray(requirements)) {
                return requirements[dayIndex] || 0;
            }
            if (typeof requirements === 'number') {
                return requirements;
            }
        }
        const shift = shifts.find(s => s.shift_id === shiftId || s.id === shiftId);
        return shift?.required_staff || 0;
    };

    const renderStats = (totalRequired, currentStats, shortage) => {
        return (
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
                        <small
                            className={`d-block ${shortage === 0 ? 'text-success' : shortage > 0 ? 'text-danger' : 'text-warning'}`}>
                            <strong>{currentStats.afterChanges}/{totalRequired}</strong>
                        </small>
                        {shortage !== 0 && (
                            <small className={`d-block fw-bold ${shortage > 0 ? 'text-danger' : 'text-warning'}`}>
                                <i className={`bi ${shortage > 0 ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-1`}></i>
                                {shortage > 0
                                    ? t('schedule.assignmentsShortage', {count: shortage})
                                    : t('schedule.assignmentsOverage', {count: Math.abs(shortage)})
                                }
                            </small>
                        )}
                        <small className="d-block text-muted">
                            {t('schedule.uniqueEmployees')}: {uniqueEmployees}
                        </small>
                    </div>
                </div>
            </div>
        );
    };


    const stretchedEmployees = useMemo(() => {
        const stretched = [];
        
        // Get pending changes for this position
        const positionPendingChanges = Object.values(pendingChanges).filter(
            change => change.positionId === position.pos_id
        );
        
        // Look through all assignments to find employees with custom times that span multiple shifts
        assignments.forEach(assignment => {
            // Check if there's a pending resize change for this assignment
            let customStartTime = assignment.custom_start_time;
            let customEndTime = assignment.custom_end_time;
            
            const resizePending = positionPendingChanges.find(change => 
                change.isResize && 
                change.empId === assignment.emp_id && 
                change.assignmentId === assignment.id
            );
            
            if (resizePending) {
                customStartTime = resizePending.custom_start_time;
                customEndTime = resizePending.custom_end_time;
            }
            
            // Only process assignments with custom times that differ from shift times
            if (customStartTime && customEndTime) {
                // Find the shift this assignment belongs to
                const assignmentShift = shifts.find(s => s.shift_id === assignment.shift_id);
                if (!assignmentShift) return;
                
                // Check if custom times extend beyond the regular shift
                const customStart = customStartTime.substring(0, 5);
                const customEnd = customEndTime.substring(0, 5);
                const shiftStart = assignmentShift.start_time.substring(0, 5);
                const shiftEnd = assignmentShift.end_time.substring(0, 5);
                
                // If custom times are different from shift times, this might need stretching
                if (customStart !== shiftStart || customEnd !== shiftEnd) {
                    // For now, find which shifts this spans across (simplified logic)
                    const dayIndex = weekDates.findIndex(date => 
                        format(date, 'yyyy-MM-dd') === (assignment.work_date || assignment.date)
                    );
                    
                    if (dayIndex >= 0) {
                        // Try to find start and end cells by their data attributes or class names
                        // This is a placeholder - we'll need proper cell identification
                        stretched.push({
                            employee: {
                                emp_id: assignment.emp_id,
                                name: assignment.first_name && assignment.last_name ? 
                                    `${assignment.first_name} ${assignment.last_name}` : 
                                    assignment.employee_name || `Employee ${assignment.emp_id}`,
                                assignment_id: assignment.id,
                            },
                            startCell: null, // Will be populated when DOM is available
                            endCell: null,   // Will be populated when DOM is available
                            customTimes: {
                                start_time: customStart,
                                end_time: customEnd
                            },
                            originalShift: assignmentShift,
                            dayIndex: dayIndex
                        });
                    }
                }
            }
        });
        
        if (stretched.length > 0) {
            console.log('🔍 Found', stretched.length, 'employees to stretch:', stretched);
        }
        
        return stretched;
    }, [assignments, shifts, weekDates, pendingChanges, position.pos_id]);

    // Update DOM references for stretched employees after render
    useEffect(() => {
        const updateStretchedEmployeesWithDOM = () => {
            if (stretchedEmployees.length > 0) {
                console.log('🔍 Found', stretchedEmployees.length, 'employees to stretch:', stretchedEmployees);
            }
            
            const updatedStretched = stretchedEmployees.map(stretched => {
                const dateStr = format(weekDates[stretched.dayIndex], 'yyyy-MM-dd');
                
                console.log('🔍 Looking for cells:', {
                    positionId: position.pos_id,
                    shiftId: stretched.originalShift.shift_id,
                    date: dateStr
                });
                
                // Find the start cell (original shift cell)
                const startCell = document.querySelector(
                    `td[data-position-id="${position.pos_id}"][data-shift-id="${stretched.originalShift.shift_id}"][data-date="${dateStr}"]`
                );
                
                console.log('📍 Start cell found:', !!startCell);
                
                // Calculate which shift the end time falls into
                const customEndTime = stretched.customTimes.end_time;
                const endShift = findShiftByTime(customEndTime, shifts);
                
                console.log('🔍 End time analysis:', {
                    customEndTime,
                    endShiftFound: !!endShift,
                    endShiftId: endShift?.shift_id,
                    originalShiftId: stretched.originalShift.shift_id,
                    willSpan: endShift && endShift.shift_id !== stretched.originalShift.shift_id
                });
                
                let endCell = startCell; // Default to same cell
                
                if (endShift && endShift.shift_id !== stretched.originalShift.shift_id) {
                    // Find the end cell if it spans to a different shift
                    endCell = document.querySelector(
                        `td[data-position-id="${position.pos_id}"][data-shift-id="${endShift.shift_id}"][data-date="${dateStr}"]`
                    ) || startCell;
                    
                    console.log('📍 End cell found:', !!endCell);
                }
                
                return {
                    ...stretched,
                    startCell,
                    endCell
                };
            }).filter(stretched => stretched.startCell && stretched.endCell);
            
            setStretchedEmployeesWithDOM(updatedStretched);
        };
        
        // Helper function to find which shift a time falls into
        const findShiftByTime = (timeStr, shifts) => {
            const timeMinutes = parseTimeToMinutes(timeStr);
            
            return shifts.find(shift => {
                const shiftStart = parseTimeToMinutes(shift.start_time.substring(0, 5));
                const shiftEnd = parseTimeToMinutes(shift.end_time.substring(0, 5));
                
                // Handle overnight shifts
                if (shiftEnd < shiftStart) {
                    return timeMinutes >= shiftStart || timeMinutes <= shiftEnd;
                } else {
                    return timeMinutes >= shiftStart && timeMinutes <= shiftEnd;
                }
            });
        };
        
        const parseTimeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        
        // Add a small delay to ensure DOM is fully rendered
        const timer = setTimeout(updateStretchedEmployeesWithDOM, 100);
        return () => clearTimeout(timer);
    }, [stretchedEmployees, weekDates, position.pos_id, shifts]);

    const renderCell = (shift, dayIndex) => {
        const dateStr = format(weekDates[dayIndex], 'yyyy-MM-dd');

        const cellAssignments = assignments.filter(a => (a.work_date || a.date) === dateStr && a.shift_id === shift.shift_id);
        const cellEmployees = cellAssignments.map(a => {
            const employeeWithShift = {
                ...employees.find(emp => emp.emp_id === a.emp_id),
                assignment_id: a.id,
                emp_id: a.emp_id,
                isCrossPosition: a.isCrossPosition,
                isCrossSite: a.isCrossSite,
                isFlexible: a.isFlexible,
                assignment_type: a.assignment_type,
                // Add shift timing information
                shift_start_time: shift.start_time,
                shift_end_time: shift.end_time,
                custom_start_time: a.custom_start_time,
                custom_end_time: a.custom_end_time,
            };
            // Debug removed
            return employeeWithShift;
        }).filter(e => e.emp_id);

        const pendingAssignments = positionPendingChanges.filter(c => c.action === 'assign' && c.date === dateStr && c.shiftId === shift.shift_id);
        const pendingRemovals = positionPendingChanges.filter(c => c.action === 'remove' && c.date === dateStr && c.shiftId === shift.shift_id);

        return (
            <ScheduleCell
                key={`${shift.shift_id}-${dayIndex}`}
                date={dateStr}
                positionId={position.pos_id}
                shiftId={shift.shift_id}
                employees={cellEmployees}
                pendingAssignments={pendingAssignments}
                pendingRemovals={pendingRemovals}
                onSpareResize={handleResizeStart}
                resizeState={{tempTime, isResizing, resizeData}}
                isEditing={isEditing}
                requiredEmployees={getRequiredEmployeesForShift(shift.shift_id, dayIndex)}
                onCellClick={onCellClick}
                onEmployeeClick={onEmployeeClick}
                onRemoveEmployee={onEmployeeRemove}
                onRemovePendingChange={onRemovePendingChange}
                pendingChanges={pendingChanges}
                formatEmployeeName={formatEmployeeName}
                shiftColor={shift.color}
                dnd={dnd}
                onDrop={handleDrop}
                highlightedEmployeeId={highlightedEmployeeId}
                onEmployeeMouseEnter={handleMouseEnter}
                onEmployeeMouseLeave={handleMouseLeave}
                selectedCell={selectedCell}
            />
        );
    };

    if (!position || !scheduleDetails) {
        return <div className="alert alert-warning">{t('errors.dataMissing')}</div>;
    }

    return (
        <div className="position-schedule-editor mb-2">
            <PositionScheduleHeader
                position={position}
                isEditing={isEditing}
                isSaving={isSaving}
                canEdit={canEdit}
                isPublished={schedule?.status === 'published'}
                shortage={shortage}
                currentStats={currentStats}
                totalRequired={totalRequired}
                positionPendingChanges={positionPendingChanges}
                showFirstNameOnly={showFirstNameOnly}
                onNameToggle={handleNameToggle}
                onToggleEdit={onToggleEdit}
                onSaveClick={handleSaveClick}
                onAutofill={handleAutofill}
                isAutofilling={isAutofilling}
            />

            <PositionScheduleTable
                weekDates={weekDates}
                shifts={shifts}
                isMobile={isMobile}
                isDark={isDark}
                t={t}
                canEdit={canEdit}
                getShiftColor={getShiftColor}
                openColorPicker={openColorPicker}
                renderCell={renderCell}
                resizeState={{tempTime, isResizing, resizeData}}
                stretchedEmployees={stretchedEmployeesWithDOM}
                formatEmployeeName={formatEmployeeName}
            />
            {isEditing && (
                renderStats(totalRequired, currentStats, shortage)
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
                        ? t('schedule.confirmSaveWithShortage', {count: shortage})
                        : t('schedule.confirmSaveWithOverage', {count: Math.abs(shortage)})
                }
                confirmText={t('common.save')}
                confirmVariant="warning"
                loading={isSaving}
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

export default PositionEditor;