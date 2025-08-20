// frontend/src/features/admin-schedule-management/ui/ScheduleView/index.js
import React, { useState } from 'react';
import { format } from "date-fns";
import { useDispatch } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import { isDarkTheme } from 'shared/lib/utils/colorUtils';
import { canEditSchedule, formatEmployeeName as formatEmployeeNameUtil } from 'shared/lib/utils/scheduleUtils';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import { useEmployeeHighlight } from '../../../../model/hooks/useEmployeeHighlight';
import { useDragAndDrop } from '../../../../model/hooks/useDragAndDrop';
import { usePositionScheduleData } from './hooks/usePositionScheduleData';
import { useScheduleDetailsActions } from '../../../../model/hooks/useScheduleDetailsActions';

import { addPendingChange, removePendingChange } from '../../../../model/scheduleSlice';
import { addNotification } from "app/model/notificationsSlice";

import ScheduleCell from '../ScheduleCell';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal/ColorPickerModal';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
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
                            isAutofilling = false
                        }) => {
    const { t } = useI18n();
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
        uniqueEmployees
    } = usePositionScheduleData(scheduleDetails, position, pendingChanges);

    const { currentTheme, colorPickerState, openColorPicker, closeColorPicker, previewColor, applyColor, getShiftColor, resetShiftColor } = useShiftColor();
    const { highlightedEmployeeId, handleMouseEnter, handleMouseLeave } = useEmployeeHighlight();
    const dnd = useDragAndDrop(isEditing, pendingChanges, assignments);

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
                message: errorItem.message || 'Cannot complete this operation'
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
            assignments.some(a => a.emp_id === emp.emp_id && a.position_id === position.pos_id)
        );
        return formatEmployeeNameUtil(employee, {
            showFullName: !showFirstNameOnly,
            checkDuplicates: true,
            contextEmployees: employeesInPosition
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
      )
    }


    const renderCell = (shift, dayIndex) => {
        const dateStr = format(weekDates[dayIndex], 'yyyy-MM-dd');

        const cellAssignments = assignments.filter(a => (a.work_date || a.date) === dateStr && a.shift_id === shift.shift_id);
        const cellEmployees = cellAssignments.map(a => ({
            ...employees.find(emp => emp.emp_id === a.emp_id),
            assignment_id: a.id
        })).filter(e => e.emp_id);

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
                        ? t('schedule.confirmSaveWithShortage', { count: shortage })
                        : t('schedule.confirmSaveWithOverage', { count: Math.abs(shortage) })
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