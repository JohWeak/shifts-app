// frontend/src/shared/ui/components/ConfirmationModal.js
import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ConfirmationModal.css';

export const ConfirmationModal = ({
                                      show,
                                      title,
                                      message,
                                      onConfirm,
                                      onHide: onCancel,
                                      loading = false,
                                      confirmText,
                                      cancelText,
                                      variant = "danger",
                                      size = "md",
                                      children,
                                      confirmVariant,
                                  }) => {
    const { t } = useI18n();

    // Добавим отладочное логирование
    React.useEffect(() => {
        if (show && message && typeof message === 'object') {
            console.error('ConfirmationModal received object as message:', message);
            console.trace('Stack trace:');
        }
    }, [show, message]);

    const finalConfirmText = confirmText || t('common.confirm');
    const finalCancelText = cancelText || t('common.cancel');
    const finalConfirmVariant = confirmVariant || variant;

    // Безопасное отображение message
    const safeMessage = React.useMemo(() => {
        if (!message) return null;
        if (typeof message === 'string') return message;
        if (typeof message === 'object' && message.message) return message.message;
        console.warn('ConfirmationModal: Invalid message type', typeof message, message);
        return String(message);
    }, [message]);

    return (
        <Modal
            show={show}
            onHide={!loading ? onCancel : undefined}
            size={size}
            centered
            backdrop={loading ? 'static' : true}
            className="confirmation-modal"
        >
            <Modal.Header closeButton={!loading}>
                <Modal.Title className={`text-${variant}`}>
                    <i className={`bi bi-exclamation-triangle me-2`}></i>
                    {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {safeMessage && <p className="mb-3">{safeMessage}</p>}
                {children}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    onClick={onCancel}
                    disabled={loading}
                    style={{ minWidth: '120px' }}
                >
                    {finalCancelText}
                </Button>
                <Button
                    variant={finalConfirmVariant}
                    onClick={onConfirm}
                    disabled={loading}
                    style={{ minWidth: '120px' }}
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
                            {t('common.loading')}
                        </>
                    ) : (
                        finalConfirmText
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmationModal;