// frontend/src/CompareAlgorithmsModal.js/admin/common/ConfirmationModal.js
import React from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';

export const ConfirmationModal = ({
                                      show,
                                      title,
                                      message,
                                      onConfirm,
                                      onCancel,
                                      loading = false,
                                      confirmText = "Confirm",
                                      cancelText = "Cancel",
                                      variant = "danger",
                                      size = "md",
                                      showWarning = true,
                                      warningMessage = "This action cannot be undone.",
                                      children
                                  }) => {
    return (
        <Modal
            show={show}
            onHide={!loading ? onCancel : undefined}
            centered
            size={size}
        >
            <Modal.Header closeButton={!loading}>
                <Modal.Title className={`text-${variant}`}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {showWarning && (
                    <Alert variant="warning" className="mb-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Warning:</strong> {warningMessage}
                    </Alert>
                )}

                {message && <p className="mb-3">{message}</p>}

                {children}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    {cancelText}
                </Button>
                <Button
                    variant={variant}
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Processing...
                        </>
                    ) : (
                        confirmText
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmationModal;