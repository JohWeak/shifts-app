// frontend/src/components/admin/schedule/ScheduleDetailsView.js
import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import PositionScheduleEditor from './PositionScheduleEditor';
import ConfirmationModal from '../common/ConfirmationModal';
import { SCHEDULE_STATUS } from '../../../constants/scheduleConstants';
import { useMessages } from '../../../i18n/messages';
import { useScheduleAPI } from '../../../hooks/useScheduleAPI';

const ScheduleDetailsView = ({
                                 scheduleDetails,
                                 editingPositions,
                                 pendingChanges,
                                 savingChanges,
                                 onToggleEditPosition,
                                 onSavePositionChanges,
                                 onCellClick,
                                 onEmployeeClick,
                                 onEmployeeRemove,
                                 onRemovePendingChange,
                                 onStatusUpdate
                             }) => {
    console.log('=== ScheduleDetailsView Debug ===');
    console.log('scheduleDetails:', scheduleDetails);


    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);

    const api = useScheduleAPI();
    if (scheduleDetails) {
        console.log('scheduleDetails.positions:', scheduleDetails.positions);
        console.log('scheduleDetails.assignments:', scheduleDetails.assignments);
        console.log('scheduleDetails.shifts:', scheduleDetails.shifts);
        console.log('scheduleDetails.employees:', scheduleDetails.employees);
    }
    const messages = useMessages('en');
    if (!scheduleDetails) {
        console.log('scheduleDetails is null/undefined');
        return null;
    }

    console.log('Positions in scheduleDetails:', scheduleDetails.positions);
    console.log('Number of positions:', scheduleDetails.positions?.length);

    const canPublish = () => {
        return scheduleDetails.schedule.status === SCHEDULE_STATUS.DRAFT;
    };

    const canEdit = () => {
        return scheduleDetails.schedule.status === SCHEDULE_STATUS.DRAFT;
    };

    const handlePublish = async () => {
        const success = await onStatusUpdate(scheduleDetails.schedule.id, SCHEDULE_STATUS.PUBLISHED);
        if (success) {
            setShowPublishModal(false);
        }
    };

    const handleUnpublish = async () => {
        const success = await onStatusUpdate(scheduleDetails.schedule.id, SCHEDULE_STATUS.DRAFT);
        if (success) {
            setShowUnpublishModal(false);
        }
    };

    const handleExport = async (format = 'pdf') => {
        try {
            setExporting(true);
            setExportMessage(null);

            const result = await api.exportSchedule(scheduleDetails.schedule.id, format);

            if (result.success) {
                setExportMessage({
                    type: 'success',
                    text: `${messages.EXPORT_SUCCESS}: ${result.filename}`
                });

                // Clear success message after 3 seconds
                setTimeout(() => setExportMessage(null), 3000);
            }
        } catch (err) {
            console.error('Error exporting schedule:', err);
            setExportMessage({
                type: 'error',
                text: `${messages.EXPORT_ERROR}: ${err.message}`
            });

            // Clear error message after 5 seconds
            setTimeout(() => setExportMessage(null), 5000);
        } finally {
            setExporting(false);
        }
    };

    const getStatusBadgeVariant = (status) => {
        return status === SCHEDULE_STATUS.PUBLISHED ? 'success' : 'warning';
    };

    const getStatusText = (status) => {
        switch (status) {
            case SCHEDULE_STATUS.PUBLISHED:
                return messages.SCHEDULE_STATUS_PUBLISHED;
            case SCHEDULE_STATUS.DRAFT:
                return messages.SCHEDULE_STATUS_DRAFT;
            case SCHEDULE_STATUS.ARCHIVED:
                return messages.SCHEDULE_STATUS_ARCHIVED;
            default:
                return status;
        }
    };

    return (
        <div>
            {/* Export Message Alert */}
            {exportMessage && (
                <Alert
                    variant={exportMessage.type === 'success' ? 'success' : 'danger'}
                    className="mb-3"
                    dismissible
                    onClose={() => setExportMessage(null)}
                >
                    <i className={`bi bi-${exportMessage.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                    {exportMessage.text}
                </Alert>
            )}

            {/* Schedule Header */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <h5>
                                {messages.WEEK}: {new Date(scheduleDetails.schedule.start_date).toLocaleDateString()} - {' '}
                                {new Date(scheduleDetails.schedule.end_date).toLocaleDateString()}
                            </h5>
                            <p className="text-muted mb-0">
                                {messages.SITE}: {scheduleDetails.schedule.work_site?.site_name || 'Unknown'} | {' '}
                                {messages.STATUS}: <Badge bg={getStatusBadgeVariant(scheduleDetails.schedule.status)}>
                                <i className={`bi bi-${scheduleDetails.schedule.status === SCHEDULE_STATUS.PUBLISHED ? 'check-circle' : 'clock'} me-1`}></i>
                                {getStatusText(scheduleDetails.schedule.status)}
                            </Badge>
                                {scheduleDetails.schedule.status === SCHEDULE_STATUS.PUBLISHED && (
                                    <small className="text-success ms-2">
                                        <i className="bi bi-eye me-1"></i>
                                        Visible to employees
                                    </small>
                                )}
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <div className="d-flex gap-2 justify-content-end flex-wrap">
                                {/* Export Buttons */}
                                <div className="btn-group">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleExport('pdf')}
                                        disabled={api.loading || exporting}
                                    >
                                        {exporting ? (
                                            <>
                                                <Spinner size="sm" className="me-1" />
                                                {messages.EXPORTING}
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-file-earmark-pdf me-1"></i>
                                                {messages.EXPORT_PDF}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleExport('csv')}
                                        disabled={api.loading || exporting}
                                    >
                                        <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                                        {messages.EXPORT_CSV}
                                    </Button>
                                </div>

                                {/* Publish/Unpublish Buttons */}
                                {canPublish() ? (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => setShowPublishModal(true)}
                                        disabled={api.loading || Object.keys(pendingChanges).length > 0}
                                    >
                                        <i className="bi bi-check-circle me-1"></i>
                                        {messages.PUBLISH}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={() => setShowUnpublishModal(true)}
                                        disabled={api.loading}
                                    >
                                        <i className="bi bi-pencil me-1"></i>
                                        {messages.UNPUBLISH}
                                    </Button>
                                )}
                            </div>

                            {/* Warning for pending changes */}
                            {Object.keys(pendingChanges).length > 0 && (
                                <div className="mt-2">
                                    <small className="text-warning">
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        Save all changes before publishing
                                    </small>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Position Schedules */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">{messages.POSITION_SCHEDULES}</h6>
                    {Object.keys(pendingChanges).length > 0 && (
                        <Badge bg="warning">
                            {Object.keys(pendingChanges).length} pending changes
                        </Badge>
                    )}
                </Card.Header>
                <Card.Body>
                    {scheduleDetails.positions && scheduleDetails.positions.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <PositionScheduleEditor
                                key={position.pos_id}
                                position={position}
                                assignments={scheduleDetails.assignments.filter(
                                    assignment => assignment.position_id === position.pos_id
                                )}
                                employees={scheduleDetails.employees}
                                shifts={scheduleDetails.all_shifts || scheduleDetails.shifts}
                                isEditing={editingPositions[position.pos_id] || false}
                                pendingChanges={Object.fromEntries(
                                    Object.entries(pendingChanges).filter(([key, change]) =>
                                        change.positionId === position.pos_id
                                    )
                                )}
                                savingChanges={savingChanges[position.pos_id] || false}
                                canEdit={canEdit()}
                                onToggleEdit={() => {
                                    console.log('Toggle edit called for position:', position.pos_id);
                                    onToggleEditPosition(position.pos_id);
                                }}
                                onSaveChanges={() => onSavePositionChanges(position.pos_id)}
                                onCellClick={onCellClick}
                                onEmployeeClick={onEmployeeClick}
                                // ИСПРАВЛЕНО: Создаем правильную функцию-обертку
                                onEmployeeRemove={(date, positionId, shiftId, empId) => {
                                    console.log('ScheduleDetailsView: onEmployeeRemove called with:', { date, positionId, shiftId, empId });

                                    // Создаем обертку для правильного вызова функции из operations
                                    if (onEmployeeRemove) {
                                        onEmployeeRemove(date, positionId, shiftId, empId);
                                    } else {
                                        console.error('onEmployeeRemove function not provided to ScheduleDetailsView');
                                    }
                                }}
                                onRemovePendingChange={onRemovePendingChange}
                                scheduleDetails={scheduleDetails}
                            />
                        ))
                    ) : (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-person-workspace fs-1 mb-3 d-block"></i>
                            <p>{messages.NO_POSITIONS}</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Confirmation Modals */}
            <ConfirmationModal
                show={showPublishModal}
                onHide={() => setShowPublishModal(false)}
                onConfirm={handlePublish}
                title="Publish Schedule"
                message={messages.CONFIRM_PUBLISH}
                confirmText={messages.PUBLISH}
                confirmVariant="success"
                isLoading={api.loading}
            />

            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={handleUnpublish}
                title="Unpublish Schedule"
                message="Are you sure you want to unpublish this schedule?"
                confirmText={messages.UNPUBLISH}
                confirmVariant="warning"
                isLoading={api.loading}
            />
        </div>
    );
};

export default ScheduleDetailsView;