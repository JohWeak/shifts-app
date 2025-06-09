// frontend/src/components/admin/schedule/ScheduleDetailsView.js
import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Spinner } from 'react-bootstrap';
import PositionScheduleEditor from './PositionScheduleEditor';
import ConfirmationModal from '../common/ConfirmationModal';
import { SCHEDULE_STATUS } from '../../../constants/scheduleConstants';
import { MESSAGES } from '../../../i18n/messages';
import { useScheduleAPI } from '../../../hooks/useScheduleAPI';

const ScheduleDetailsView = ({
                                 scheduleDetails,
                                 editingPositions,
                                 pendingChanges,
                                 savingChanges,
                                 onToggleEditPosition,
                                 onSavePositionChanges,
                                 onCellClick,
                                 onEmployeeRemove,
                                 onRemovePendingChange,
                                 onStatusUpdate
                             }) => {
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [exporting, setExporting] = useState(false);
    const api = useScheduleAPI();

    if (!scheduleDetails) return null;

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

    const handleExport = async () => {
        try {
            setExporting(true);
            const result = await api.exportSchedule(scheduleDetails.schedule.id, 'pdf');

            if (result.success) {
                console.log('Schedule exported successfully:', result.filename);
            }
        } catch (err) {
            console.error('Error exporting schedule:', err);
            alert(`Error exporting schedule: ${err.message}`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            {/* Schedule Header */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <h5>
                                Week: {new Date(scheduleDetails.schedule.start_date).toLocaleDateString()} - {' '}
                                {new Date(scheduleDetails.schedule.end_date).toLocaleDateString()}
                            </h5>
                            <p className="text-muted mb-0">
                                Site: {scheduleDetails.schedule.work_site?.site_name || 'Unknown'} | {' '}
                                Status: <Badge bg={scheduleDetails.schedule.status === SCHEDULE_STATUS.PUBLISHED ? 'success' : 'warning'}>
                                <i className={`bi bi-${scheduleDetails.schedule.status === SCHEDULE_STATUS.PUBLISHED ? 'check-circle' : 'clock'} me-1`}></i>
                                {scheduleDetails.schedule.status.charAt(0).toUpperCase() + scheduleDetails.schedule.status.slice(1)}
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
                                {/* Export Button */}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleExport}
                                    disabled={api.loading || exporting}
                                >
                                    {exporting ? (
                                        <>
                                            <Spinner size="sm" className="me-1" />
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-download me-1"></i>
                                            Export PDF
                                        </>
                                    )}
                                </Button>

                                {/* Publish/Unpublish Buttons */}
                                {canPublish() ? (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => setShowPublishModal(true)}
                                        disabled={api.loading || Object.keys(pendingChanges).length > 0}
                                    >
                                        <i className="bi bi-check-circle me-1"></i>
                                        Publish Schedule
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={() => setShowUnpublishModal(true)}
                                        disabled={api.loading}
                                    >
                                        <i className="bi bi-pencil me-1"></i>
                                        Unpublish & Edit
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
                    <h6 className="mb-0">Position Schedules</h6>
                    {!canEdit() && (
                        <Badge bg="info" className="ms-2">
                            <i className="bi bi-lock me-1"></i>
                            Read-only (Published)
                        </Badge>
                    )}
                </Card.Header>
                <Card.Body>
                    {scheduleDetails.schedule_matrix &&
                        Object.entries(scheduleDetails.schedule_matrix).map(([positionId, positionData]) => (
                            <PositionScheduleEditor
                                key={positionId}
                                positionId={positionId}
                                positionData={positionData}
                                scheduleDetails={scheduleDetails}
                                isEditing={editingPositions.has(positionId) && canEdit()}
                                pendingChanges={pendingChanges}
                                savingChanges={savingChanges}
                                onToggleEdit={canEdit() ? onToggleEditPosition : () => {}}
                                onSaveChanges={onSavePositionChanges}
                                onCellClick={canEdit() ? onCellClick : () => {}}
                                onEmployeeRemove={onEmployeeRemove}
                                onRemovePendingChange={onRemovePendingChange}
                                readOnly={!canEdit()}
                            />
                        ))
                    }
                </Card.Body>
            </Card>

            {/* Publish Confirmation Modal */}
            <ConfirmationModal
                show={showPublishModal}
                title="Publish Schedule"
                message="Are you sure you want to publish this schedule?"
                onConfirm={handlePublish}
                onCancel={() => setShowPublishModal(false)}
                loading={api.loading}
                confirmText="Publish Schedule"
                variant="success"
                showWarning={false}
            >
                <div className="bg-light p-3 rounded mb-3">
                    <h6 className="mb-2">
                        <i className="bi bi-info-circle me-2"></i>
                        Publishing Effects:
                    </h6>
                    <ul className="mb-0 small">
                        <li>Schedule becomes visible to all employees</li>
                        <li>Editing becomes restricted (can be unpublished if needed)</li>
                        <li>Employees will receive notifications about their assignments</li>
                        <li>Schedule appears in employee dashboards and mobile apps</li>
                    </ul>
                </div>
            </ConfirmationModal>
            {/* Unpublish Confirmation Modal */}
            <ConfirmationModal
                show={showUnpublishModal}
                title="Unpublish Schedule"
                message="Are you sure you want to unpublish this schedule? It will become hidden from employees and editable again."
                onConfirm={handleUnpublish}
                onCancel={() => setShowUnpublishModal(false)}
                loading={api.loading}
                confirmText="Unpublish Schedule"
                variant="warning"
            />
        </div>
    );
};

export default ScheduleDetailsView;