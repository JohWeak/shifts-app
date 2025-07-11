// frontend/src/shared/ui/components/ColorPickerModal/ColorPickerModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import {useI18n} from "../../../lib/i18n/i18nProvider";
import './ColorPickerModal.css';

const PRESET_COLORS = [
    '#FFE4A3', // Светло-жёлтый
    '#A3D5FF', // Светло-голубой
    '#FFB3BA', // Светло-розовый
    '#B5E7A0', // Светло-зелёный
    '#DDA0DD', // Светло-фиолетовый
    '#F0E68C', // Хаки
    '#87CEEB', // Небесно-голубой
    '#DEB887', // Бежевый
];

const ColorPickerModal = ({
                              show,
                              onHide,
                              onColorSelect,
                              initialColor = '#6c757d',
                              title = 'Select Color',
                              showPreview = true,
                              onColorChange = null,
                              saveMode = 'global',
                              currentTheme = 'light',
                              hasLocalColor = false,
                              onResetColor = null,          // проп для сброса
                              originalGlobalColor = null    // глобальный цвет из БД
                          }) => {
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const { t } = useI18n();

    useEffect(() => {
        if (show) {
            setSelectedColor(initialColor);
        }
    }, [show, initialColor]);

    const handleColorChange = (color) => {
        setSelectedColor(color);
        // Вызываем callback для предпросмотра на лету
        if (onColorChange) {
            onColorChange(color);
        }
    };

    const handleSubmit = () => {
        onColorSelect(selectedColor);
        onHide();
    };

    const handleCancel = () => {
        // Восстанавливаем исходный цвет при отмене
        if (onColorChange) {
            onColorChange(initialColor);
        }
        onHide();
    };

    const handleReset = () => {
        if (onResetColor) {
            onResetColor();
            // Возвращаем к глобальному цвету
            if (originalGlobalColor) {
                handleColorChange(originalGlobalColor);
            }
        }
    };

    return (
        <Modal show={show} onHide={handleCancel} size="sm" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-palette me-2"></i>
                    {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Индикатор режима сохранения */}
                <div className={`alert ${saveMode === 'local' ? 'alert-info' : 'alert-success'} py-2 px-3 mb-3`}>
                    <small className="d-flex align-items-center justify-content-between">
                        <span>
                            <i className={`bi ${saveMode === 'local' ? 'bi-person' : 'bi-globe'} me-1`}></i>
                            {saveMode === 'local'
                                ? t('color.savingLocally', { theme: t(`theme.${currentTheme}`) })
                                : t('color.savingGlobally')
                            }
                        </span>
                        {/* Кнопка сброса для локальных настроек */}
                        {saveMode === 'local' && hasLocalColor && onResetColor && (
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-decoration-none"
                                onClick={handleReset}
                                title={t('color.resetToGlobal')}
                            >
                                <i className="bi bi-arrow-counterclockwise text-warning"></i>
                            </Button>
                        )}
                    </small>
                </div>
                {/* Preset colors */}
                <div className="mb-3">
                    <label className="form-label small text-muted">{t('color.quickColors')}:</label>
                    <div className="d-flex gap-2 flex-wrap">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                className="color-preset-btn"
                                style={{
                                    backgroundColor: color,
                                    borderColor: selectedColor === color ? '#0d6efd' : '#dee2e6',
                                    borderWidth: selectedColor === color ? '2px' : '1px'
                                }}
                                onClick={() => handleColorChange(color)}
                                title={color}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom color picker */}
                <div>
                    <label className="form-label small text-muted">Custom color:</label>
                    <div className="d-flex gap-2 align-items-center">
                        <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="form-control form-control-color"
                            style={{ width: '60px', height: '40px' }}
                        />
                        <input
                            type="text"
                            value={selectedColor.toUpperCase()}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                                    handleColorChange(value);
                                }
                            }}
                            className="form-control form-control-sm font-monospace"
                            style={{ width: '100px' }}
                            placeholder="#FFFFFF"
                        />
                    </div>
                </div>

                {/* Preview */}
                {showPreview && (
                    <div className="mt-3">
                        <label className="form-label small text-muted">{t('color.preview')}:</label>
                        <div
                            className="color-preview"
                            style={{ backgroundColor: selectedColor }}
                        >
                            {t('color.sampleText')}
                        </div>
                    </div>
                )}
                {/* Показываем оригинальный цвет, если есть локальные изменения */}
                {saveMode === 'local' && hasLocalColor && originalGlobalColor && (
                    <div className="mt-3 small text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        {t('color.globalColorIs')}:
                        <span
                            className="ms-2 px-2 py-1 rounded"
                            style={{
                                backgroundColor: originalGlobalColor,
                                border: '1px solid var(--bs-border-color)'
                            }}
                        >
                            {originalGlobalColor}
                        </span>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-between">                {/* Кнопка полного сброса слева */}
                {saveMode === 'local' && hasLocalColor && onResetColor && (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                            if (window.confirm(t('color.confirmResetLocal'))) {
                                handleReset();
                                onHide();
                                window.location.reload();
                            }
                        }}
                    >
                        <i className="bi bi-trash me-1"></i>
                        {t('color.resetLocal')}
                    </Button>
                )}
                {/* Стандартные кнопки справа */}
                <div className={`d-flex gap-2 ${!hasLocalColor || saveMode !== 'local' ? 'ms-auto' : ''}`}>
                    <Button variant="secondary" size="sm" onClick={handleCancel}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit}>
                        <i className="bi bi-check me-1"></i>
                        {t('color.apply')}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ColorPickerModal;