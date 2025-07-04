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
    const finalConfirmText = confirmText || t('common.confirm');
    const finalCancelText = cancelText || t('common.cancel');
    const finalConfirmVariant = confirmVariant || variant;
    return (
        <Modal
            show={show}
            onHide={!loading ? onCancel : undefined}
            centered
            size={size}
            backdrop={loading ? 'static' : true}
            className="confirmation-modal" // <-- Шаг 2: Добавляем класс для стилизации
        >
            <Modal.Header closeButton={!loading}>
                <Modal.Title className={`text-${variant}`}>
                    <i className={`bi bi-exclamation-triangle me-2`}></i> {/* Убрали дублирование text-variant */}
                    {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {message && <p className="mb-3">{message}</p>}
                {children}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    onClick={onCancel}
                    disabled={loading}
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
                                className="me-2" />
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