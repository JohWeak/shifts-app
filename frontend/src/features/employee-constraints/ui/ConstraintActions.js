// frontend/src/features/employee-constraints/ui/ConstraintActions.js

import React, { useState } from 'react';
import { Card, Button, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ConstraintActions.css';

const ConstraintActions = ({
                               currentMode,
                               onModeChange,
                               isSubmitted,
                               onSubmit,
                               onEdit,
                               onClear,
                               submitting,
                               onColorButtonClick,
                           }) => {
    const { t } = useI18n();

    return (
        <Card className="shadow-sm mb-4 constraint-actions-panel">
            <Card.Body className="p-2">
                <div className="panel-content justify-content-center"> {/* Упрощаем центрирование */}
                    {/* Правая часть: Основные кнопки действий */}
                    <div className="actions-container">
                        {isSubmitted ? (
                            <Button variant="secondary" size="lg" onClick={onEdit}>
                                <i className="bi bi-pencil me-2"></i>
                                {t('common.edit')}
                            </Button>
                        ) : (
                            <>
                                {/* Группа 1: Сегментированный переключатель */}
                                <div className={`segmented-control-wrapper mode-${currentMode}`}>
                                    <div className="segmented-control">
                                        <div className="indicator"></div>
                                        <div className="segment" onClick={() => onModeChange('cannot_work')}>
                                            <span>{t('constraints.cannotWork')}</span>
                                        </div>
                                        <div className="segment" onClick={() => onModeChange('prefer_work')}>
                                            <span>{t('constraints.preferWork')}</span>
                                        </div>
                                    </div>
                                    <div className="palette-container" onClick={() => onColorButtonClick(currentMode)}>
                                        <i className="bi bi-palette"></i>
                                    </div>
                                </div>

                                {/* Группа 2: Управление */}
                                <div className="action-buttons-group">
                                    <Button variant="outline-secondary" onClick={onClear} disabled={submitting} title={t('common.reset')}>
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </Button>
                                    <Button variant="primary" onClick={onSubmit} disabled={submitting} className="submit-button">
                                        {submitting ? <Spinner size="sm" as="span" className="me-2" /> : <i className="bi bi-check-lg me-1"></i>}
                                        {submitting ? t('common.saving') : t('common.submit')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ConstraintActions;