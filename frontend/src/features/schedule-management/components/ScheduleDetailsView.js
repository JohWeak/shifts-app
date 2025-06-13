// frontend/src/features/schedule-management/components/ScheduleDetailsView.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import PositionScheduleEditor from './PositionScheduleEditor';
import ConfirmationModal from '../../../shared/ui/ConfirmationModal';
import { useMessages } from '../../../shared/lib/i18n/messages';

// Импортируем все необходимые экшены из Redux Slice
import {
    updateScheduleStatus,
    updateScheduleAssignments,
    exportSchedule, // <--- Новый экшен для экспорта
    toggleEditPosition,
    addPendingChange,
    removePendingChange,
} from '../../../app/store/slices/scheduleSlice';

const ScheduleDetailsView = ({ onCellClick }) => {
    const dispatch = useDispatch();
    const messages = useMessages('en');

    // Получаем данные напрямую из Redux store
    const { scheduleDetails, editingPositions, pendingChanges, loading } = useSelector(state => state.schedule);

    // --- Локальное состояние только для UI этого компонента ---
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false); // Для спиннера на кнопке экспорта
    const [exportAlert, setExportAlert] = useState(null); // Для уведомления об экспорте
    const [isSaving, setIsSaving] = useState(false); // Для спиннера на кнопке Save

    if (!scheduleDetails) {
        return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }

    // --- Обработчики, которые диспатчат экшены Redux ---

    const handleStatusUpdate = async (status) => {
        // .unwrap() помогает обработать результат промиса (успех/ошибка)
        await dispatch(updateScheduleStatus({ scheduleId: scheduleDetails.schedule.id, status })).unwrap();
        setShowPublishModal(false);
        setShowUnpublishModal(false);
    };

    const handleSaveChanges = async (positionId) => {
        const positionChanges = Object.values(pendingChanges).filter(c => c.positionId === positionId);
        if (positionChanges.length === 0) return;

        setIsSaving(true);
        await dispatch(updateScheduleAssignments({ scheduleId: scheduleDetails.schedule.id, changes: positionChanges }));
        setIsSaving(false);
        // Режим редактирования закроется автоматически, так как pendingChanges для этой позиции очистятся в слайсе
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        setExportAlert(null);
        try {
            const resultAction = await dispatch(exportSchedule({ scheduleId: scheduleDetails.schedule.id, format })).unwrap();
            setExportAlert({ type: 'success', text: `${messages.EXPORT_SUCCESS}: ${resultAction.filename}` });
        } catch (error) {
            setExportAlert({ type: 'danger', text: `${messages.EXPORT_ERROR}: ${error}` });
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportAlert(null), 5000);
        }
    };

    const { schedule, positions, employees, all_shifts: shifts } = scheduleDetails;
    const canPublish = schedule.status === 'draft' && Object.keys(pendingChanges).length === 0;
    const canEdit = schedule.status === 'draft';

    return (
        <div>
            {exportAlert && (
                <Alert variant={exportAlert.type} dismissible onClose={() => setExportAlert(null)}>
                    {exportAlert.text}
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <h5>{messages.WEEK}: {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}</h5>
                            <p className="text-muted mb-0">
                                {messages.SITE}: {schedule.work_site?.site_name || '...'} | {' '}
                                {messages.STATUS}: <Badge bg={schedule.status === 'published' ? 'success' : 'warning'}>{schedule.status}</Badge>
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <div className="d-flex gap-2 justify-content-end flex-wrap">
                                <div className="btn-group">
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
                                        {isExporting ? <Spinner size="sm" /> : <i className="bi bi-file-earmark-pdf me-1"></i>} {messages.EXPORT_PDF}
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
                                        <i className="bi bi-file-earmark-spreadsheet me-1"></i> {messages.EXPORT_CSV}
                                    </Button>
                                </div>
                                {canEdit ? (
                                    <Button variant="success" size="sm" onClick={() => setShowPublishModal(true)} disabled={!canPublish || loading === 'pending'}>
                                        <i className="bi bi-check-circle me-1"></i> {messages.PUBLISH}
                                    </Button>
                                ) : (
                                    <Button variant="outline-warning" size="sm" onClick={() => setShowUnpublishModal(true)} disabled={loading === 'pending'}>
                                        <i className="bi bi-pencil me-1"></i> {messages.UNPUBLISH}
                                    </Button>
                                )}
                            </div>
                            {!canPublish && schedule.status === 'draft' && (
                                <div className="text-warning small mt-2 text-end">Save changes before publishing.</div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h6 className="mb-0">{messages.POSITION_SCHEDULES}</h6>
                </Card.Header>
                <Card.Body>
                    {positions?.length > 0 ? (
                        positions.map(position => (
                            <PositionScheduleEditor
                                key={position.pos_id}
                                position={position}
                                assignments={scheduleDetails.assignments}
                                employees={employees}
                                shifts={shifts}
                                isEditing={!!editingPositions[position.pos_id]}
                                pendingChanges={Object.fromEntries(
                                    Object.entries(pendingChanges).filter(([, change]) => change.positionId === position.pos_id)
                                )}
                                savingChanges={isSaving}
                                canEdit={canEdit}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSaveChanges={() => handleSaveChanges(position.pos_id)}
                                onCellClick={onCellClick} // Приходит из родителя, т.к. управляет модалкой там
                                onEmployeeRemove={(date, posId, shiftId, empId) => {
                                    const assignment = scheduleDetails.assignments.find(a => a.emp_id === empId && a.work_date === date && a.shift_id === shiftId);
                                    if (assignment) {
                                        const key = `${posId}-${date}-${shiftId}-remove-${empId}`;
                                        dispatch(addPendingChange({ key, change: { action: 'remove', assignmentId: assignment.id, positionId: posId, date, shiftId, empId }}));
                                    }
                                }}
                                onRemovePendingChange={(key) => dispatch(removePendingChange(key))}
                                scheduleDetails={scheduleDetails}
                            />
                        ))
                    ) : (
                        <div className="text-center text-muted py-4">{messages.NO_POSITIONS}</div>
                    )}
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={showPublishModal}
                onHide={() => setShowPublishModal(false)}
                onConfirm={() => handleStatusUpdate('published')}
                title="Publish Schedule"
                message={messages.PUBLISH_CONFIRMATION}
                loading={loading === 'pending'}
            />
            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={() => handleStatusUpdate('draft')}
                title="Unpublish Schedule"
                message={messages.CONFIRM_UNPUBLISH}
                variant="warning"
                loading={loading === 'pending'}
            />
        </div>
    );
};

export default ScheduleDetailsView;