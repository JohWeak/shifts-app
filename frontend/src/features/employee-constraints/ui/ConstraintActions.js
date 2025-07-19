// frontend/src/features/employee-constraints/ui/ConstraintActions.js
import React from 'react';
import {Card, Button, Alert, Spinner} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';

const ConstraintActions = ({
                               currentMode,
                               onModeChange,
                               limits,
                               isSubmitted,
                               onShowColorSettings,
                               onSubmit,
                               onEdit,
                               onClear,
                               submitting,
                               onShowInstructions,
                               onColorButtonClick
                           }) => {
    const {t} = useI18n();

    return (
        <Card className={"shadow-sm mb-4"}>
            <Card.Body>
                <div
                    className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                    {/* Левая часть: Помощь */}
                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            className="rounded-circle"
                            onClick={onShowInstructions}
                            title={t('constraints.instructions.title')}
                        >
                            <i className="bi bi-question-lg"></i>
                        </Button>
                    </div>

                    {/* Правая часть: Основные кнопки действий */}
                    <div className="d-flex align-items-center gap-2">
                        {isSubmitted ? (
                            // --- РЕЖИМ ПРОСМОТРА: Только кнопка "Редактировать" ---
                            <Button variant="secondary" size="lg" onClick={onEdit}>
                                <i className="bi bi-pencil me-2"></i>
                                {t('common.edit')}
                            </Button>
                        ) : (
                            // --- РЕЖИМ РЕДАКТИРОВАНИЯ: Все кнопки ---
                            <>
                                {/* Кнопки выбора режима */}
                                <div className="btn-group" role="group">
                                    <Button
                                        variant={currentMode === 'cannot_work' ? 'danger' : 'outline-danger'}
                                        onClick={() => onModeChange('cannot_work')}
                                        className="d-flex align-items-center"
                                    >
                                        {t('constraints.cannotWork')}
                                        <span className="vr mx-2"></span>
                                        <i className="bi bi-palette" onClick={(e) => { e.stopPropagation(); onColorButtonClick('cannotWork'); }}></i>
                                    </Button>
                                    <Button
                                        variant={currentMode === 'prefer_work' ? 'success' : 'outline-success'}
                                        onClick={() => onModeChange('prefer_work')}
                                        className="d-flex align-items-center"
                                    >
                                        {t('constraints.preferWork')}
                                        <span className="vr mx-2"></span>
                                        <i className="bi bi-palette" onClick={(e) => { e.stopPropagation(); onColorButtonClick('preferWork'); }}></i>
                                    </Button>
                                </div>

                                {/* Кнопки действий */}
                                <div className="btn-group" role="group">
                                    <Button variant="outline-secondary" onClick={onClear} disabled={submitting}>
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </Button>
                                    <Button variant="primary" onClick={onSubmit} disabled={submitting}>
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