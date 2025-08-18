// frontend/src/features/admin-schedule-management/ui/ScheduleView/index.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Alert, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useScheduleValidation } from '../../model/hooks/useScheduleValidation';
import { useScheduleDetailsActions } from '../../model/hooks/useScheduleDetailsActions';
import {
    exportSchedule, toggleEditPosition,
    addPendingChange, removePendingChange,
} from '../../model/scheduleSlice';
import PositionEditor from './components/Position';
import ScheduleInfo from './components/ScheduleInfo';
import ValidationModal from './components/ValidationModal';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import { useScheduleAutofill } from '../../model/hooks/useScheduleAutofill';
import EmployeeRecommendationsPanel from '../EmployeeRecommendations/EmployeeRecommendationsPanel';
import EmployeeRecommendationsModal from '../EmployeeRecommendations/EmployeeRecommendationsModal';
import './ScheduleView.css';

const ScheduleView = ({
                          onCellClick,
                          selectedCell,
                          onEmployeeSelect,
                          isPanelOpen,
                          showEmployeeModal,
                          isLargeScreen,
                          closeAllModals,
                          panelWidth,
                          onPanelWidthChange
                      }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { scheduleDetails, editingPositions, pendingChanges, loading } = useSelector(state => state.schedule);
    const { autofillPosition, isAutofilling: isPositionAutofilling, isProcessing } = useScheduleAutofill();

    // --- ACTIONS & MODALS HOOK ---
    const {
        promptPublish,
        promptUnpublish,
        promptAutofill,
        isAutofilling,
        renderModals,
        handleSavePosition,
        confirmSaveWithViolations,
        validationViolations,
        showValidationModal,
        setShowValidationModal
    } = useScheduleDetailsActions(scheduleDetails?.schedule);

    // --- LOCAL UI STATE ---
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportAlert, setExportAlert] = useState(null);

    // --- HOOKS FOR LOGIC ---

    const handleSaveChanges = async (positionId) => {
        setIsSaving(true);

        try {
            const result = await handleSavePosition(positionId);

            if (!result.showValidation) {
                // Successfully saved or handled
                console.log('Position saved successfully');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        setExportAlert(null);
        try {
            const result = await dispatch(exportSchedule({ scheduleId: scheduleDetails.schedule.id, format })).unwrap();
            setExportAlert({ type: 'success', message: `${t('schedule.exportSuccess')}: ${result.filename}` });
        } catch (error) {
            setExportAlert({ type: 'danger', message: `${t('common.error')}: ${error}` });
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportAlert(null), 5000);
        }
    };

    const handleEmployeeRemove = (date, positionId, shiftId, empId, assignmentId = null) => {
        const key = `remove-${positionId}-${date}-${shiftId}-${empId}`;
        dispatch(addPendingChange({ key, change: { action: 'remove', positionId, date, shiftId, empId, assignmentId } }));
    };

    const handleEmployeeClick = (date, positionId, shiftId, empId) => {
        const assignment = scheduleDetails?.assignments?.find(a => (a.pos_id === positionId || a.position_id === positionId) && a.emp_id === empId && a.shift_id === shiftId && (a.work_date === date || a.date === date));
        onCellClick(date, positionId, shiftId, empId, assignment?.id);
    };

    if (loading === 'pending' && !scheduleDetails) {
        return <LoadingState size="lg" message={t('common.loading')} />;
    }
    if (!scheduleDetails) {
        return <EmptyState title={t('schedule.notFound')} description={t('schedule.selectFromList')} />;
    }

    const isUIBlocked = isProcessing || isAutofilling;

    return (
        <>
            {isUIBlocked &&
                <div
                    className="schedule-processing-overlay">
                    <div
                        className="processing-spinner">
                        <Spinner
                            animation="border"
                            variant="primary"
                        />
                        <p>{t('schedule.processingChanges')}</p>
                    </div>
                </div>
            }

            <Card className={`mb-3 ${isUIBlocked ? 'disabled-card' : ''}`}>
                <Card.Body>
                    <ScheduleInfo
                        schedule={scheduleDetails.schedule}
                        onPublish={promptPublish}
                        onUnpublish={promptUnpublish}
                        onExport={handleExport}
                        isExporting={isExporting}
                        scheduleDetails={scheduleDetails}
                        onAutofill={promptAutofill}
                        isAutofilling={isAutofilling}
                    />
                    {exportAlert && <Alert variant={exportAlert.type} dismissible onClose={() => setExportAlert(null)}>{exportAlert.message}</Alert>}
                </Card.Body>
            </Card>

            <Card className={isUIBlocked ? 'disabled-card' : ''}>
                <Card.Body>
                    {scheduleDetails.positions?.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <PositionEditor
                                key={position.pos_id}
                                position={position}
                                schedule={scheduleDetails.schedule}
                                isEditing={!!editingPositions[position.pos_id]}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSaveChanges={() => handleSaveChanges(position.pos_id)}
                                onCellClick={onCellClick}
                                scheduleDetails={scheduleDetails}
                                pendingChanges={pendingChanges}
                                isSaving={isSaving}
                                onEmployeeClick={handleEmployeeClick}
                                onEmployeeRemove={handleEmployeeRemove}
                                onRemovePendingChange={(key) => dispatch(removePendingChange(key))}
                                onAutofill={autofillPosition}
                                isAutofilling={isPositionAutofilling}
                                selectedCell={selectedCell}
                            />
                        ))
                    ) : (
                        <EmptyState icon={<i className="bi bi-person-workspace fs-1"></i>} title={t('position.noPositions')} description="This schedule doesn't have any position assignments yet." />
                    )}
                </Card.Body>
            </Card>

            {showValidationModal && (
                <ValidationModal
                    show={showValidationModal}
                    onHide={() => setShowValidationModal(false)}
                    onConfirm={confirmSaveWithViolations}
                    violations={validationViolations}
                    title={t('schedule.validationWarning')}
                />
            )}

            {renderModals()}

            {/* Portal render */}
            {isLargeScreen ? (
                <EmployeeRecommendationsPanel
                    isOpen={isPanelOpen}
                    onClose={closeAllModals}
                    selectedPosition={selectedCell}
                    onEmployeeSelect={onEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                    panelWidth={panelWidth}
                    onWidthChange={onPanelWidthChange}
                />
            ) : (
                <EmployeeRecommendationsModal
                    show={showEmployeeModal}
                    onHide={closeAllModals}
                    selectedPosition={selectedCell}
                    onEmployeeSelect={onEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                />
            )}
        </>
    );
};

export default ScheduleView;