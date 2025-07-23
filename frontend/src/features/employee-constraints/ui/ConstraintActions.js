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
                               onCancel,
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
                            <Button variant="primary" onClick={onEdit} className="edit-button">
                                <i className="bi bi-pencil-square me-2"></i> {/* Бонус: чуть более солидная иконка */}
                                {t('common.edit')}
                            </Button>
                        ) : (
                            <>
                                {/* Группа 1: Сегментированный переключатель */}
                                <div className={`segmented-control-wrapper mode-${currentMode}`}>
                                    {/* Слот для палитры слева (для "Cannot Work" в LTR) */}
                                    <div
                                        className="palette-container palette-cannot-work"
                                        onClick={() => onColorButtonClick('cannot_work')}
                                        title={t('constraints.cannotWork_color')}
                                    >
                                        <i className="bi bi-palette"></i>
                                    </div>

                                    {/* Сам переключатель (без изменений) */}
                                    <div className="segmented-control">
                                        <div className="indicator"></div>
                                        <div className="segment segment-cannot-work" onClick={() => onModeChange('cannot_work')}>
                                            <span>{t('constraints.cannotWork')}</span>
                                        </div>
                                        <div className="segment segment-prefer-work" onClick={() => onModeChange('prefer_work')}>
                                            <span>{t('constraints.preferWork')}</span>
                                        </div>
                                    </div>

                                    {/* Слот для палитры справа (для "Prefer to Work" в LTR) */}
                                    <div
                                        className="palette-container palette-prefer-work"
                                        onClick={() => onColorButtonClick('prefer_work')}
                                        title={t('constraints.preferWork_color')}
                                    >
                                        <i className="bi bi-palette"></i>
                                    </div>
                                </div>

                                {/* Группа 2: Управление */}
                                <div className="action-buttons-group">
                                    <Button variant="outline-secondary" onClick={onCancel} disabled={submitting} title={t('common.cancel')}>
                                        {t('common.cancel')}
                                    </Button>
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