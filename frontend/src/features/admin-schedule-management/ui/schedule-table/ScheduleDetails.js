// frontend/src/features/admin-schedule-management/components/ScheduleDetails.js
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Card, Alert} from 'react-bootstrap';

import ScheduleEditor from './ScheduleEditor';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import ScheduleInfo from './ScheduleInfo';
import ScheduleActions from '../schedule-list/ScheduleActions';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import {useI18n} from 'shared/lib/i18n/i18nProvider';

import './ScheduleDetails.css';

// Импортируем все необходимые экшены из Redux Slice
import {
    updateScheduleStatus,
    updateScheduleAssignments,
    exportSchedule,
    toggleEditPosition,
    addPendingChange,
    removePendingChange
} from '../../model/scheduleSlice';

const ScheduleDetails = ({onCellClick}) => {
    const dispatch = useDispatch();
    const {t} = useI18n();

    // Получаем данные напрямую из Redux store
    const {scheduleDetails, editingPositions, pendingChanges, loading} = useSelector(state => state.schedule);

    // --- Локальное состояние только для UI этого компонента ---
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false); // Для спиннера на кнопке экспорта
    const [exportAlert, setExportAlert] = useState(null); // Для уведомления об экспорте
    const [isSaving, setIsSaving] = useState(false); // Для спиннера на кнопке Save

    if (!scheduleDetails) {
        return <LoadingState size="lg" message={t('common.loading')}/>;
    }

    // --- Обработчики, которые диспатчат экшены Redux ---

    const handleStatusUpdate = async (status) => {
        // .unwrap() помогает обработать результат промиса (успех/ошибка)
        await dispatch(updateScheduleStatus({scheduleId: scheduleDetails.schedule.id, status})).unwrap();
        setShowPublishModal(false);
        setShowUnpublishModal(false);
    };

    const handleSaveChanges = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(c => c.positionId === positionId);
        if (positionChanges.length === 0) return;

        setIsSaving(true);
        await dispatch(updateScheduleAssignments({scheduleId: scheduleDetails.schedule.id, changes: positionChanges}));
        setIsSaving(false);
        // Режим редактирования закроется автоматически, так как pendingChanges для этой позиции очистятся в слайсе
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        setExportAlert(null);
        try {
            const resultAction = await dispatch(exportSchedule({
                scheduleId: scheduleDetails.schedule.id,
                format
            })).unwrap();
            setExportAlert({type: 'success', text: `${t.exportSuccess}: ${resultAction.filename}`});
        } catch (error) {
            setExportAlert({type: 'danger', text: `${t.error}: ${error}`});
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportAlert(null), 5000);
        }
    };

    const handleEmployeeRemove = (date, positionId, shiftId, empId, assignmentId = null) => {
        const key = `remove-${positionId}-${date}-${shiftId}-${empId}`;
        dispatch(addPendingChange({
            key,
            change: {
                action: 'remove',
                positionId,
                date,
                shiftId,
                empId,
                assignmentId
            }
        }));
    };

    const handleEmployeeClick = (date, positionId, shiftId, empId) => {
        // Найдем assignment_id для этого сотрудника
        const assignment = scheduleDetails?.assignments?.find(a =>
            (a.pos_id === positionId || a.position_id === positionId) &&
            a.emp_id === empId &&
            a.shift_id === shiftId &&
            (a.work_date === date || a.date === date)
        );

        // При клике на сотрудника открываем модальное окно для его замены
        // Передаем assignment_id если он есть
        onCellClick(date, positionId, shiftId, empId, assignment?.id);
    };

    const handleRemovePendingChange = (key) => {
        dispatch(removePendingChange(key));
    };

    return (
        <>
            <Card className="mb-4 ">
                <Card.Body>
                    <ScheduleInfo
                        schedule={scheduleDetails.schedule}
                        positions={scheduleDetails.positions}
                        onPublish={() => setShowPublishModal(true)}
                        onUnpublish={() => setShowUnpublishModal(true)}
                        onExport={handleExport}
                        isExporting={isExporting}
                    />


                </Card.Body>
                {exportAlert && (
                    <Alert
                        variant={exportAlert.type}
                        dismissible
                        onClose={() => setExportAlert(null)}
                    >
                        {exportAlert.message}
                    </Alert>
                )}
            </Card>

            <Card>
                <Card.Body>
                    {scheduleDetails.positions?.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <ScheduleEditor
                                key={position.pos_id}
                                position={position}
                                isEditing={!!editingPositions[position.pos_id]}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSaveChanges={() => handleSaveChanges(position.pos_id)}
                                onCancel={() => dispatch(toggleEditPosition(position.pos_id))}
                                onCellClick={onCellClick}
                                scheduleDetails={scheduleDetails}
                                pendingChanges={pendingChanges}
                                isSaving={isSaving}
                                onEmployeeClick={handleEmployeeClick}
                                onEmployeeRemove={handleEmployeeRemove}
                                onRemovePendingChange={handleRemovePendingChange}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon={<i className="bi bi-person-workspace fs-1"></i>}
                            title={t('position.noPositions')}
                            description="This schedule doesn't have any position assignments yet."
                        />
                    )}
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={showPublishModal}
                onHide={() => setShowPublishModal(false)}
                onConfirm={() => handleStatusUpdate('published')}
                title={t('schedule.publishSchedule')}
                message={t('schedule.confirmPublish')}
                loading={loading === 'pending'}
                confirmText={t('schedule.publish')}
                confirmVariant="success"
            />
            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={() => handleStatusUpdate('draft')}
                title={t('schedule.unpublishEdit')}
                message={t('schedule.confirmUnpublish')}
                variant="warning"
                loading={loading === 'pending'}
                confirmText={t('schedule.unpublishEdit')}
                confirmVariant="warning"
            />
        </>
    );
};

export default ScheduleDetails;