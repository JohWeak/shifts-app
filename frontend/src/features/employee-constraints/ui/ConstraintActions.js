// frontend/src/features/employee-constraints/ui/ConstraintActions.js

import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ConstraintActions.css';

// Вынесем группы кнопок в отдельные компоненты для чистоты
const SegmentedControl = ({ currentMode, onModeChange, t }) => (
    <div className={`segmented-control-wrapper mode-${currentMode}`}>
        <div className="segmented-control">
            <div className="indicator"></div>
            <div className="segment segment-cannot-work" onClick={() => onModeChange('cannot_work')}>
                <span>{t('constraints.cannotWork')}</span>
            </div>
            <div className="segment segment-prefer-work" onClick={() => onModeChange('prefer_work')}>
                <span>{t('constraints.preferWork')}</span>
            </div>
        </div>
    </div>
);

const PaletteButton = ({ currentMode, onColorButtonClick, t }) => (
    <Button
        variant="outline-secondary"
        className={`palette-button mode-${currentMode}`}
        onClick={() => onColorButtonClick(currentMode)}
        title={t('constraints.changeColor')}
    >
        <i className="bi bi-palette"></i>
    </Button>
);

const ConstraintActions = (props) => {
    const { t } = useI18n();
    const { isSubmitted, onEdit, isMobile, ...actionProps } = props;

    return (
        <div className="mb-2 p-2 constraint-actions-panel">
            {isSubmitted ? (
                // 1. РЕЖИМ ОТОБРАЖЕНИЯ: Только кнопка "Редактировать"
                <div className="panel-content justify-content-center">
                    <Button variant="primary" onClick={onEdit} className="edit-button">
                        <i className="bi bi-pencil-square me-2"></i>
                        {t('common.edit')}
                    </Button>
                </div>
            ) : isMobile ? (
                // 2. РЕЖИМ РЕДАКТИРОВАНИЯ (МОБИЛЬНЫЙ)
                <div className="panel-content mobile-layout">
                    <SegmentedControl t={t} {...actionProps} />
                    <div className="mobile-actions-container">
                        <div className="secondary-actions-group">
                            <Button variant="outline-secondary" onClick={actionProps.onCancel} disabled={actionProps.submitting} title={t('common.cancel')}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="outline-secondary" onClick={actionProps.onClear} disabled={actionProps.submitting} title={t('common.reset')}>
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </Button>
                            <PaletteButton t={t} {...actionProps} />
                        </div>
                        <Button variant="primary" onClick={actionProps.onSubmit} disabled={actionProps.submitting} className="submit-button">
                            {actionProps.submitting ? <Spinner size="sm" as="span" className="me-2" /> : <i className="bi bi-check-lg me-1"></i>}
                            {actionProps.submitting ? t('common.saving') : t('common.submit')}
                        </Button>
                    </div>
                </div>
            ) : (
                // 3. РЕЖИМ РЕДАКТИРОВАНИЯ (ДЕКСТОП)
                <div className="panel-content desktop-layout">
                    <div className="secondary-actions-group">
                        <Button variant="outline-secondary" onClick={actionProps.onCancel} disabled={actionProps.submitting} title={t('common.cancel')}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="outline-secondary" onClick={actionProps.onClear} disabled={actionProps.submitting} title={t('common.reset')}>
                            <i className="bi bi-arrow-counterclockwise"></i>
                        </Button>
                        <PaletteButton t={t} {...actionProps} />
                    </div>
                    <SegmentedControl t={t} {...actionProps} />
                    <Button variant="primary" onClick={actionProps.onSubmit} disabled={actionProps.submitting} className="submit-button">
                        {actionProps.submitting ? <Spinner size="sm" as="span" className="me-2" /> : <i className="bi bi-check-lg me-1"></i>}
                        {actionProps.submitting ? t('common.saving') : t('common.submit')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ConstraintActions;