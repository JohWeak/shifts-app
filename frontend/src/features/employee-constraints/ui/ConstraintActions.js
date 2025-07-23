// frontend/src/features/employee-constraints/ui/ConstraintActions.js

import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ConstraintActions.css';

// Вынесем группы кнопок в отдельные компоненты для чистоты
const SegmentedControl = ({ currentMode, onModeChange, t, customColors }) => {
    // Стиль для индикатора
    const indicatorStyle = {
        backgroundColor: customColors[currentMode].background
    };

    // Стили для текста. Применяются только к активному сегменту.
    const cannotWorkTextStyle = {
        color: currentMode === 'cannot_work' ? customColors.cannot_work.text : ''
    };
    const preferWorkTextStyle = {
        color: currentMode === 'prefer_work' ? customColors.prefer_work.text : ''
    };

    return (
        <div className={`segmented-control-wrapper mode-${currentMode}`}>
            <div className="segmented-control">
                <div className="indicator" style={indicatorStyle}></div>
                <div className="segment segment-cannot-work" onClick={() => onModeChange('cannot_work')}>
                    <span style={cannotWorkTextStyle}>{t('constraints.cannotWork')}</span>
                </div>
                <div className="segment segment-prefer-work" onClick={() => onModeChange('prefer_work')}>
                    <span style={preferWorkTextStyle}>{t('constraints.preferWork')}</span>
                </div>
            </div>
        </div>
    );
};

const PaletteButton = ({ currentMode, onColorButtonClick, t, customColors }) => {
    // Стиль для кнопки палитры
    const paletteStyle = {
        backgroundColor: customColors[currentMode].background,
        borderColor: customColors[currentMode].background,
        color: customColors[currentMode].text
    };

    return (
        <Button
            variant="outline-secondary" // variant теперь не так важен
            className="palette-button"
            style={paletteStyle}
            onClick={() => onColorButtonClick(currentMode)}
            title={t('constraints.changeColor')}
        >
            <i className="bi bi-palette"></i>
        </Button>
    );
};

const ConstraintActions = (props) => {
    const { t } = useI18n();
    const { isSubmitted, onEdit, isMobile, customColors, ...actionProps } = props;

    // В зависимости от isSubmitted, добавляем класс к главному контейнеру
    const panelClassName = `mb-2 p-2 constraint-actions-panel ${isSubmitted ? 'view-mode' : 'edit-mode'}`;

    return (
        <div className={panelClassName}>
            {/* 1. Контейнер для кнопки "Редактировать" (всегда в DOM) */}
            <div className="edit-button-container">
                <Button variant="primary" onClick={onEdit} className="edit-button">
                    <i className="bi bi-pencil-square me-2"></i>
                    {t('common.edit')}
                </Button>
            </div>

            {/* 2. Контейнер для полного набора кнопок (всегда в DOM) */}
            <div className="action-controls-container">
                {isMobile ? (
                    // МОБИЛЬНАЯ ВЕРСТКА
                    <div className="panel-content mobile-layout">
                        <SegmentedControl t={t} customColors={customColors} {...actionProps} />
                        <div className="mobile-actions-container">
                            <div className="secondary-actions-group">
                                <Button variant="outline-secondary" onClick={actionProps.onCancel} disabled={actionProps.submitting} title={t('common.cancel')}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="outline-secondary" onClick={actionProps.onClear} disabled={actionProps.submitting} title={t('common.reset')}>
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                </Button>
                                <PaletteButton t={t} customColors={customColors} {...actionProps} />
                            </div>
                            <Button variant="primary" onClick={actionProps.onSubmit} disabled={actionProps.submitting} className="submit-button">
                                {actionProps.submitting ? <Spinner size="sm" as="span" className="me-2"/> : <i className="bi bi-check-lg me-1"></i>}
                                {actionProps.submitting ? t('common.saving') : t('common.submit')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // ДЕСКТОПНАЯ ВЕРСТКА
                    <div className="panel-content desktop-layout">
                        <div className="secondary-actions-group">
                            <Button variant="outline-secondary" onClick={actionProps.onCancel} disabled={actionProps.submitting} title={t('common.cancel')}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="outline-secondary" onClick={actionProps.onClear} disabled={actionProps.submitting} title={t('common.reset')}>
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </Button>
                            <PaletteButton t={t} customColors={customColors} {...actionProps} />
                        </div>
                        <SegmentedControl t={t} customColors={customColors} {...actionProps} />
                        <Button variant="primary" onClick={actionProps.onSubmit} disabled={actionProps.submitting} className="submit-button">
                            {actionProps.submitting ? <Spinner size="sm" as="span" className="me-2"/> : <i className="bi bi-check-lg me-1"></i>}
                            {actionProps.submitting ? t('common.saving') : t('common.submit')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConstraintActions;