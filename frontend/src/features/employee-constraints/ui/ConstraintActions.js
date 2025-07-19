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
                           }) => {
    const {t} = useI18n();

    return (
        <Card className={"shadow-sm mb-4"}>
            <Card.Body>
                <div
                    className="d-flex justify-content-between align-items-center gap-3 flex-wrap">                    {/* Левая часть: Кнопка "Помощь" и Настройки цвета */}
                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            className="rounded-circle"
                            onClick={onShowInstructions}
                            title={t('constraints.instructions.title')}
                        >
                            <i className="bi bi-question-lg"></i>
                        </Button>
                        <Button
                            variant="outline-secondary"
                            className="rounded-circle"
                            onClick={onShowColorSettings}
                            title={t('constraints.colorSettings')}
                        >
                            <i className="bi bi-palette"></i>
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
                                    >
                                        {t('constraints.cannotWork')}
                                    </Button>
                                    <Button
                                        variant={currentMode === 'prefer_work' ? 'success' : 'outline-success'}
                                        onClick={() => onModeChange('prefer_work')}
                                    >
                                        {t('constraints.preferWork')}
                                    </Button>
                                </div>

                                {/* Кнопки действий */}
                                <div className="btn-group" role="group">
                                    <Button variant="outline-secondary" onClick={onClear} disabled={submitting}>
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </Button>
                                    <Button variant="primary" onClick={onSubmit} disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <Spinner size="sm" as="span" animation="border" className="me-2"/>
                                                {t('common.saving')}
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-1"></i>
                                                {t('common.submit')}
                                            </>
                                        )}
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