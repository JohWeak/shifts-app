// frontend/src/features/schedule-management/components/ScheduleDetailsView.js
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Card, Alert} from 'react-bootstrap';

import PositionScheduleEditor from './PositionScheduleEditor';
import ConfirmationModal from '../../../shared/ui/ConfirmationModal';
import ScheduleInfo from './ScheduleInfo';
import ScheduleActions from './ScheduleActions';
import LoadingState from '../../../shared/ui/LoadingState/LoadingState';
import EmptyState from '../../../shared/ui/EmptyState/EmptyState';
import {useI18n} from '../../../shared/lib/i18n/i18nProvider';
// Импортируем все необходимые экшены из Redux Slice
import {
    updateScheduleStatus,
    updateScheduleAssignments,
    exportSchedule, // <--- Новый экшен для экспорта
    toggleEditPosition,
} from '../../../app/store/slices/scheduleSlice';

const ScheduleDetailsView = ({onCellClick}) => {
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

    const {schedule, positions, employees, all_shifts: shifts} = scheduleDetails;
   // const canPublish = schedule.status === 'draft' && Object.keys(pendingChanges).length === 0;
   // const canEdit = schedule.status === 'draft';

    return (
        <>
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-4">
                        <h5 className="mb-0">{t('schedule.scheduleDetails')}</h5>
                        <ScheduleActions
                            status={scheduleDetails.schedule.status}
                            onPublish={() => setShowPublishModal(true)}
                            onUnpublish={() => setShowUnpublishModal(true)}
                            onExport={handleExport}
                            isExporting={isExporting}
                        />
                    </div>

                    <ScheduleInfo
                        schedule={scheduleDetails.schedule}
                        positions={scheduleDetails.positions}
                    />

                    {exportAlert && (
                        <Alert
                            variant={exportAlert.type}
                            dismissible
                            onClose={() => setExportAlert(null)}
                        >
                            {exportAlert.message}
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    {scheduleDetails.positions?.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <PositionScheduleEditor
                                key={position.pos_id}
                                position={position}
                                isEditing={!!editingPositions[position.pos_id]}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSave={() => handleSaveChanges(position.pos_id)}
                                onCancel={() => dispatch(toggleEditPosition(position.pos_id))}
                                onCellClick={onCellClick}
                                scheduleDetails={scheduleDetails}
                                pendingChanges={pendingChanges}
                                isSaving={isSaving}
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
            />
            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={() => handleStatusUpdate('draft')}
                title={t('schedule.unpublishEdit')}
                message={t('schedule.confirmUnpublish')}
                variant="warning"
                loading={loading === 'pending'}
            />
        </>
    );
};

export default ScheduleDetailsView;