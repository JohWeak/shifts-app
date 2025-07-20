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
                               weeklyTemplate,
                               limitParams
                           }) => {
    const { t } = useI18n();
    const [showInstructions, setShowInstructions] = useState(false);
    const toggleShowInstructions = () => setShowInstructions(!showInstructions);

    return (
        <>
            <Card className="shadow-sm mb-4 constraint-actions-panel">
                <Card.Body className="p-2">
                    <div className="panel-content ">
                        {/* Левая часть: Кнопка помощи */}
                        <div className="help-container">
                            <Button
                                variant="outline-secondary"
                                className="rounded-circle help-button"
                                onClick={toggleShowInstructions}
                                title={t('constraints.instructions.title')}
                            >
                                <i className="bi bi-question-lg"></i>
                            </Button>
                        </div>

                        {/* Правая часть: Основные кнопки действий */}
                        <div className="actions-container">
                            {isSubmitted ? (
                                <Button variant="secondary" size="lg" onClick={onEdit}>
                                    <i className="bi bi-pencil me-2"></i>
                                    {t('common.edit')}
                                </Button>
                            ) : (
                                <>
                                    {/* Группа 1: Выбор режима */}
                                    <div className="mode-selector-group">
                                        <Button
                                            variant={currentMode === 'cannot_work' ? 'danger' : 'outline-danger'}
                                            onClick={() => onModeChange('cannot_work')}
                                            className="d-flex align-items-center"
                                        >
                                            {t('constraints.cannotWork')}
                                            <span className="vr mx-2"></span>
                                            <i className="bi bi-palette" onClick={(e) => { e.stopPropagation(); onColorButtonClick('cannot_work'); }}></i>
                                        </Button>
                                        <Button
                                            variant={currentMode === 'prefer_work' ? 'success' : 'outline-success'}
                                            onClick={() => onModeChange('prefer_work')}
                                            className="d-flex align-items-center"
                                        >
                                            {t('constraints.preferWork')}
                                            <span className="vr mx-2"></span>
                                            <i className="bi bi-palette" onClick={(e) => { e.stopPropagation(); onColorButtonClick('prefer_work'); }}></i>
                                        </Button>
                                    </div>

                                    {/* Группа 2: Управление */}
                                    <div className="action-buttons-group">
                                        <Button variant="outline-secondary" onClick={onClear} disabled={submitting} title={t('common.reset')}>
                                            <i className="bi bi-arrow-counterclockwise"></i>
                                        </Button>
                                        <Button variant="primary" onClick={onSubmit} disabled={submitting} className="submit-button">
                                            {submitting ? (
                                                <Spinner size="sm" as="span" className="me-2" />
                                            ) : (
                                                <i className="bi bi-check-lg me-1"></i>
                                            )}
                                            {submitting ? t('common.saving') : t('common.submit')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>
            <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1056 }}>
                <Toast show={showInstructions} onClose={toggleShowInstructions} autohide delay={5000}>
                    <Toast.Header closeButton={true}>
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <strong className="me-auto">{t('constraints.instructions.title')}</strong>
                    </Toast.Header>
                    <Toast.Body>
                        <ul className="mb-0 ps-3">
                            <li>{t('constraints.instructions.selectMode')}</li>
                            <li>{t('constraints.instructions.clickCells')}</li>
                            {weeklyTemplate && (
                                <li>{t('constraints.instructions.limits', limitParams)}</li>
                            )}
                        </ul>
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
};

export default ConstraintActions;