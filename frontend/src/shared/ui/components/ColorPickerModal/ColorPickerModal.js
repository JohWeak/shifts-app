// frontend/src/shared/ui/components/ColorPickerModal/ColorPickerModal.js
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Modal, Button, Container, Col, Row} from 'react-bootstrap';
import {useI18n} from "shared/lib/i18n/i18nProvider";
import './ColorPickerModal.css';
import {getContrastTextColor, isDarkTheme, lightenColor} from "shared/lib/utils/colorUtils";
import ThemeColorService from 'shared/lib/services/ThemeColorService';

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
                              onResetColor = null,
                              shiftObject = null,
                              userRole = 'employee',
                              originalGlobalColor = null
                          }) => {
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [originalColorOnOpen, setOriginalColorOnOpen] = useState(initialColor);
    const {t} = useI18n();

    const themeAwareGlobalColor = useMemo(() => {
        if (shiftObject) {
            const resetShift = { ...shiftObject, color: originalGlobalColor };
            return ThemeColorService.getShiftColor(resetShift, currentTheme, userRole);
        }
        return originalGlobalColor || '#6c757d';
    }, [shiftObject, originalGlobalColor, currentTheme, userRole]);

    // 2. Вычисляем "на лету", есть ли у нас кастомный цвет.
    // Это и есть наш новый `hasLocalColor`.
    const hasActiveLocalColor = selectedColor !== themeAwareGlobalColor;

    useEffect(() => {
        if (show) {
            setSelectedColor(initialColor);
        }
    }, [show, initialColor]);


    const handleColorChange = (color) => {
        setSelectedColor(color);
        if (onColorChange) { onColorChange(color); }
    };

    const handleSaveAndClose = () => {
        if (onColorSelect) { onColorSelect(selectedColor); }
        onHide();
    };

    // Просто закрывает шторку (сохраняя изменения)
    const handleClose = () => {
        // Здесь мы НЕ откатываем цвет. Изменения остаются.
        onHide();
    };

    // Отменяет изменения и закрывает шторку
    const handleCancelAndClose = () => {
        if (onColorChange) { onColorChange(initialColor); }
        onHide();
    };

    const handleReset = () => {
        if (onResetColor) {
            const newColor = onResetColor();
            if (newColor) { handleColorChange(newColor); }
        }
    };

    const colorInputRef = useRef(null);
    return (
        <Modal
            show={show}
            onHide={handleSaveAndClose}
            dialogClassName="bottom-sheet"
            backdropClassName="bottom-sheet-backdrop"
            contentClassName="shadow-lg"
        >
            <Container className="pt-2 pb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 ms-2">{title}</h6>
                    <Button variant="light" className="rounded-circle" onClick={handleCancelAndClose}>
                        <i className="bi bi-x-lg"></i>
                    </Button>
                </div>
                {/* Индикатор режима сохранения */}
                <div className={`alert ${saveMode === 'local' ? 'alert-info' : 'alert-success'} py-2 px-3 mb-3 small`}>
                    <small className="d-flex align-items-center justify-content-between">
                        <span>
                            <i className={`bi ${saveMode === 'local' ? 'bi-person' : 'bi-globe'} me-1`}></i>
                            {saveMode === 'local'
                                ? t('color.savingLocally', {theme: t(`theme.${currentTheme}`)})
                                : t('color.savingGlobally')
                            }
                        </span>

                    </small>
                </div>
                {/* Preset colors */}
                <Row className="g-1 align-items-center preset-colors-wrapper mb-2">
                    {PRESET_COLORS.map(color => (
                        <Col xs="auto">
                            <button
                                key={color}
                                className="color-preset-btn flex-shrink-0"
                                style={{
                                    backgroundColor: color,
                                    borderColor: selectedColor === color ? '#0d6efd' : '#dee2e6',
                                    borderWidth: selectedColor === color ? '2px' : '1px'
                                }}
                                onClick={() => handleColorChange(color)}
                            />
                        </Col>
                    ))}

                </Row>
                {/* 5. Ряд с HEX и глобальным цветом */}
                <Row className="g-2 align-items-center small text-muted justify-content-between mb-2">
                    <Col xs="auto" className="d-flex align-items-center">
                        <label className='me-2'>{t('color.customColor')}</label>
                        {/*{selectedColor.toUpperCase()}*/}
                    </Col>
                    {saveMode === 'local' && hasActiveLocalColor && (
                        <Col xs="auto" className="d-flex align-items-center">
                            <i className="bi bi-globe small me-1 mt-0"></i>
                            <span className="me-2">{t('color.globalColorIs')}:</span>
                            <div className="global-color-swatch" style={{ backgroundColor: themeAwareGlobalColor }}></div>
                            {/* Кнопка сброса для локальных настроек */}
                            {saveMode === 'local' && hasLocalColor && onResetColor && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className=" text-decoration-none py-0"
                                    onClick={handleReset}
                                    title={t('color.resetToGlobal')}
                                >
                                    <i className="bi bi-arrow-counterclockwise text-warning"></i>
                                </Button>
                            )}
                        </Col>
                    )}

                </Row>
                {/* Custom color picker */}
                <Row className="g-2 align-items-center mb-2">
                    {/* 1. Наша красивая, кастомная кнопка на всю ширину */}
                    <div
                        className="color-preview-button" // Используем наш кастомный класс
                        style={{
                            backgroundColor: selectedColor,
                            color: getContrastTextColor(selectedColor, isDarkTheme())
                        }}
                        onClick={() => colorInputRef.current?.click()} // При клике "нажимаем" на скрытый инпут
                    >
                        {/* Текст, который ты хотел наложить */}
                        {t('color.pickColor')}
                        <i className="bi bi-eyedropper ms-2"></i>
                    </div>

                    {/* 2. Настоящий, но полностью невидимый инпут */}
                    <input
                        type="color"
                        ref={colorInputRef}
                        value={selectedColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        style={{
                            // Прячем его, но оставляем функциональным
                            opacity: 0,
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            border: 'none',
                            padding: 0
                        }}
                    />

                </Row>



            </Container>
        </Modal>
    );
};

export default ColorPickerModal;