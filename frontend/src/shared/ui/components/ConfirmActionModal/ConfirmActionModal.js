// frontend/src/shared/ui/components/ConfirmActionModal/ConfirmActionModal.js
import React from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ConfirmActionModal.css';

const ConfirmActionModal = ({
                                show,
                                onHide,
                                onConfirm,
                                title,
                                message,
                                confirmText,
                                confirmVariant = 'danger',
                                cancelText,
                                loading = false,
                                size = 'md',
                                showWarning = true,
                                warningMessage,
                                icon,
                                children
                            }) => {
    const { t } = useI18n();

    // Default values with i18n
    const defaultConfirmText = confirmText || t('common.confirm');
    const defaultCancelText = cancelText || t('common.cancel');
    const defaultWarningMessage = warningMessage || t('common.actionCannotBeUndone');
    const defaultTitle = title || t('common.confirmAction');

    // Icon mapping based on variant
    const getIcon = () => {
        if (icon) return icon;

        switch (confirmVariant) {
            case 'danger':
                return 'bi-exclamation-triangle';
            case 'warning':
                return 'bi-exclamation-circle';
            case 'success':
                return 'bi-check-circle';
            case 'info':
                return 'bi-info-circle';
            default:
                return 'bi-question-circle';
        }
    };

    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        if (!loading) {
            onHide();
        }
    };

    return (
        <Modal
            show={show}
            onHide={handleCancel}
            centered
            size={size}
            backdrop={loading ? 'static' : true}
            keyboard={!loading}
            className="confirm-action-modal"
        >
            <Modal.Header closeButton={!loading} className={`confirm-modal-header-${confirmVariant}`}>
                <Modal.Title className="d-flex align-items-center">
                    <i className={`${getIcon()} me-2`}></i>
                    {defaultTitle}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="confirm-modal-body">
                {showWarning && (
                    <Alert variant="warning" className="mb-3 confirm-warning-alert">
                        <div className="d-flex align-items-start">
                            <i className="bi bi-exclamation-triangle me-2 mt-1"></i>
                            <div>
                                <strong>{t('common.warning')}:</strong>
                                <div className="mt-1">{defaultWarningMessage}</div>
                            </div>
                        </div>
                    </Alert>
                )}

                {message && (
                    <div className="confirm-message mb-3">
                        {message}
                    </div>
                )}

                {children}
            </Modal.Body>

            <Modal.Footer className="confirm-modal-footer">
                <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                    className="confirm-cancel-btn"
                >
                    {defaultCancelText}
                </Button>
                <Button
                    variant={confirmVariant}
                    onClick={handleConfirm}
                    disabled={loading}
                    className="confirm-action-btn"
                >
                    {loading ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            {t('common.processing')}
                        </>
                    ) : (
                        <>
                            <i className={`${getIcon()} me-2`}></i>
                            {defaultConfirmText}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmActionModal;