// frontend/src/features/employee-constraints/ui/ConstraintInstructions.js
import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const ConstraintInstructions = ({
                                    currentMode,
                                    onModeChange,
                                    limits,
                                    isSubmitted,
                                    limitError,
                                    shakeEffect,
                                    onShowColorSettings
                                }) => {
    const { t } = useI18n();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <div className="row align-items-center">
                    <div className="col-md-4 text-end">
                        <div className="btn-group mb-2" role="group">
                            <Button
                                variant={currentMode === 'cannot_work' ? 'danger' : 'outline-danger'}
                                onClick={() => onModeChange('cannot_work')}
                                disabled={isSubmitted}
                            >
                                {t('constraints.cannotWork')}
                            </Button>
                            <Button
                                variant={currentMode === 'prefer_work' ? 'success' : 'outline-success'}
                                onClick={() => onModeChange('prefer_work')}
                                disabled={isSubmitted}
                            >
                                {t('constraints.preferWork')}
                            </Button>
                        </div>
                        <div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={onShowColorSettings}
                            >
                                <i className="bi bi-palette me-1"></i>
                                {t('constraints.colorSettings')}
                            </Button>
                        </div>
                    </div>
                    <div className="col-md-8">
                        <h5>{t('constraints.instructions.title')}</h5>
                        <ul className="mb-0">
                            <li>{t('constraints.instructions.selectMode')}</li>
                            <li>{t('constraints.instructions.clickCells')}</li>
                            <li>{t('constraints.instructions.limits', {
                                cannotWork: limits.cannot_work_days,
                                preferWork: limits.prefer_work_days
                            })}</li>
                        </ul>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ConstraintInstructions;