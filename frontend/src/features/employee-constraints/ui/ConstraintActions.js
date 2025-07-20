// frontend/src/features/employee-constraints/ui/ConstraintActions.js
import React, { useState } from 'react'; // Добавлен useState для примера Toast
import { Card, Button, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

// Импортируем наш новый файл стилей
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

    // Локальное состояние для управления видимостью Toast
    const [showInstructions, setShowInstructions] = useState(false);
    const toggleShowInstructions = () => setShowInstructions(!showInstructions);

    return (
        <>
            {/* Используем наш новый класс-обертку .constraint-actions-panel */}
            <Card className="shadow-sm mb-4 constraint-actions-panel">
                <Card.Body>
                    <div className="panel-content">
                        {/* Левая часть: Помощь */}
                        <div className="d-flex align-items-center">
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
                                <Button variant="secondary" onClick={onEdit}>
                                    <i className="bi bi-pencil me-2"></i>
                                    {t('common.edit')}
                                </Button>
                            ) : (
                                <>
                                    {/* Кнопки выбора режима БЕЗ btn-group */}
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

                                    {/* Кнопки действий БЕЗ btn-group */}
                                    <Button variant="outline-secondary" onClick={onClear} disabled={submitting}>
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </Button>
                                    <Button variant="primary" onClick={onSubmit} disabled={submitting}>
                                        {submitting ? <Spinner size="sm" as="span" className="me-2" /> : <i className="bi bi-check-lg me-1"></i>}
                                        {submitting ? t('common.saving') : t('common.submit')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Контейнер для Toast уведомления остается прежним */}
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