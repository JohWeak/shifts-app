// frontend/src/features/employee-constraints/ui/ConstraintInstructions.js
import React from 'react';
import {Card, Button, Alert, Spinner} from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const ConstraintInstructions = ({
                                    currentMode,
                                    onModeChange,
                                    limits,
                                    isSubmitted,
                                    onShowColorSettings,
                                    onSubmit,
                                    onEdit,
                                    onClear,
                                    submitting
                                }) => {
    const { t } = useI18n();

    return (
        <Card className={"shadow-sm mb-4"}>
            <Card.Body>
                <div className="row align-items-center">
                    {/* Левая колонка с инструкциями (без изменений) */}
                    <div className="col-md-7">
                        <h5>{t('constraints.instructions.title')}</h5>
                        <ul className="mb-md-0">
                            <li>{t('constraints.instructions.selectMode')}</li>
                            <li>{t('constraints.instructions.clickCells')}</li>
                            <li>{t('constraints.instructions.limits', {
                                cannotWork: limits.cannot_work_days,
                                preferWork: limits.prefer_work_days
                            })}</li>
                        </ul>
                    </div>

                    {/* --- ПРАВАЯ КОЛОНКА С КНОПКАМИ (полностью переработана) --- */}
                    <div className="col-md-5 text-end">
                        {isSubmitted ? (
                            // --- РЕЖИМ ПРОСМОТРА: Только кнопка "Редактировать" ---
                            <Button variant="secondary" size="lg" onClick={onEdit} className="w-100">
                                <i className="bi bi-pencil me-2"></i>
                                {t('common.edit')}
                            </Button>
                        ) : (
                            // --- РЕЖИМ РЕДАКТИРОВАНИЯ: Все кнопки ---
                            <div className="d-flex flex-column align-items-stretch gap-2">
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
                                    <Button variant="primary" onClick={onSubmit} disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <Spinner size="sm" as="span" animation="border" role="status" aria-hidden="true" className="me-2" />
                                                {t('common.saving')}
                                            </>
                                        ) : (
                                            t('common.submit')
                                        )}
                                    </Button>
                                    <Button variant="outline-secondary" onClick={onClear} disabled={submitting}>
                                        {t('common.clear')}
                                    </Button>
                                </div>

                                {/* Кнопка настроек цвета (можно оставить здесь) */}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={onShowColorSettings}
                                    className="mt-1"
                                >
                                    <i className="bi bi-palette me-1"></i>
                                    {t('constraints.colorSettings')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ConstraintInstructions;