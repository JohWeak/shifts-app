// frontend/src/features/employee-constraints/ui/ConstraintActions.js

import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ConstraintActions.css';

// Вынесем группы кнопок в отдельные компоненты для чистоты
const SegmentedControl = ({ currentMode, onModeChange, onColorButtonClick, t }) => (
    <div className={`segmented-control-wrapper mode-${currentMode}`}>
        <div
            className="palette-container palette-cannot-work"
            onClick={() => onColorButtonClick('cannot_work')}
            title={t('constraints.cannotWork_color')}
        >
            <i className="bi bi-palette"></i>
        </div>

        <div className="segmented-control">
            <div className="indicator"></div>
            <div className="segment segment-cannot-work" onClick={() => onModeChange('cannot_work')}>
                <span>{t('constraints.cannotWork')}</span>
            </div>
            <div className="segment segment-prefer-work" onClick={() => onModeChange('prefer_work')}>
                <span>{t('constraints.preferWork')}</span>
            </div>
        </div>

        <div
            className="palette-container palette-prefer-work"
            onClick={() => onColorButtonClick('prefer_work')}
            title={t('constraints.preferWork_color')}
        >
            <i className="bi bi-palette"></i>
        </div>
    </div>
);

const ActionButtons = ({ submitting, onCancel, onClear, onSubmit, t }) => (
    <>
        <div className="secondary-actions-group">
            <Button variant="outline-secondary" onClick={onCancel} disabled={submitting} title={t('common.cancel')}>
                {t('common.cancel')}
            </Button>
            <Button variant="outline-secondary" onClick={onClear} disabled={submitting} title={t('common.reset')}>
                <i className="bi bi-arrow-counterclockwise"></i>
            </Button>
        </div>
        <Button variant="primary" onClick={onSubmit} disabled={submitting} className="submit-button">
            {submitting ? <Spinner size="sm" as="span" className="me-2" /> : <i className="bi bi-check-lg me-1"></i>}
            {submitting ? t('common.saving') : t('common.submit')}
        </Button>
    </>
);

const ConstraintActions = (props) => {
    const { t } = useI18n();
    const { isSubmitted, onEdit, isMobile } = props;

    // --- ОСНОВНАЯ ЛОГИКА РЕНДЕРИНГА ---
    return (
        <div className=" mb-2 p-2 constraint-actions-panel">
                {isSubmitted ? (
                    // Режим "Редактировать" - одна кнопка в центре
                    <div className="panel-content justify-content-center">
                        <Button variant="primary" onClick={onEdit} className="edit-button">
                            <i className="bi bi-pencil-square me-2"></i>
                            {t('common.edit')}
                        </Button>
                    </div>
                ) : isMobile ? (
                    // --- МОБИЛЬНАЯ ВЕРСТКА ---
                    <div className="panel-content mobile-layout">
                        <SegmentedControl {...props} t={t} />
                        <div className="mobile-actions-container">
                            <ActionButtons {...props} t={t} />
                        </div>
                    </div>
                ) : (
                    // --- ДЕСКТОПНАЯ ВЕРСТКА ---
                    <div className="panel-content desktop-layout">
                        {/* 1. Группа "Отмена/Сброс" теперь в начале (визуально будет слева для LTR) */}
                        <div className="secondary-actions-group">
                            <Button variant="outline-secondary" onClick={props.onCancel} disabled={props.submitting} title={t('common.cancel')}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="outline-secondary" onClick={props.onClear} disabled={props.submitting} title={t('common.reset')}>
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </Button>
                        </div>

                        {/* 2. Сегментированный переключатель остается в центре */}
                        <SegmentedControl {...props} t={t} />

                        {/* 3. Кнопка "Submit" теперь в конце (визуально будет справа для LTR) */}
                        <Button variant="primary" onClick={props.onSubmit} disabled={props.submitting} className="submit-button desktop-submit">
                            {props.submitting ? <Spinner size="sm" as="span" className="me-2" /> : <i className="bi bi-check-lg me-1"></i>}
                            {props.submitting ? t('common.saving') : t('common.submit')}
                        </Button>
                    </div>
                )}
        </div>
    );
};

export default ConstraintActions;