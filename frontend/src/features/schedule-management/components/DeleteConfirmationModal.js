// frontend/src/CompareAlgorithmsModal.js/admin/schedule/DeleteConfirmationModal.js
import React from 'react';
import { Modal, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';

const DeleteConfirmationModal = ({
                                     show,
                                     schedule,
                                     deleting,
                                     onConfirm,
                                     onCancel
                                 }) => {
    const messages = useMessages('en');

    if (!schedule) return null;

    return (
        <Modal
            show={show}
            onHide={!deleting ? onCancel : undefined}
            centered
            className="delete-confirmation-modal"
        >
            <Modal.Header closeButton={!deleting}>
                <Modal.Title className="text-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {messages.CONFIRM_DELETION}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert variant="warning" className="mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> {messages.DELETE_WARNING}
                </Alert>

                <p className="mb-3">
                    {messages.DELETE_CONFIRMATION_TEXT}
                </p>

                <div className="schedule-info bg-light p-3 rounded">
                    <div className="row">
                        <div className="col-sm-4"><strong>Week:</strong></div>
                        <div className="col-sm-8">
                            {new Date(schedule.start_date).toLocaleDateString()} - {' '}
                            {new Date(schedule.end_date).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-4"><strong>Site:</strong></div>
                        <div className="col-sm-8">
                            {schedule.workSite?.site_name || schedule.site_name || 'Unknown'}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-4"><strong>Status:</strong></div>
                        <div className="col-sm-8">
                            <Badge bg={schedule.status === 'draft' ? 'warning' : 'secondary'}>
                                {schedule.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <p className="mt-3 text-muted">
                    {messages.DELETE_ASSIGNMENTS_WARNING}
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={deleting}
                >
                    {messages.CANCEL}
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={deleting}
                >
                    {deleting ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            {messages.DELETING}
                        </>
                    ) : (
                        <>
                            <i className="bi bi-trash me-2"></i>
                            {messages.DELETE_SCHEDULE}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteConfirmationModal;