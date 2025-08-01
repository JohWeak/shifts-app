// frontend/src/shared/ui/components/ColorPickerModal/ColorPickerModal.js
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Modal, Button, Container, Col, Row, Form} from 'react-bootstrap';
import {useI18n} from "shared/lib/i18n/i18nProvider";
import './ColorPickerModal.css';
import {getContrastTextColor, isDarkTheme, hexToHsl, hslToHex} from "shared/lib/utils/colorUtils";
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
    '#B2F2E8', // Светлая бирюза (новый)
    '#FFDAB9', // Персиковый (новый)
    '#E6E6FA', // Лаванда (новый)
    '#FFFFFF', // Белый
    '#000000', // Черный
];


const ColorPickerModal = ({
                              show,
                              onHide,
                              onColorSelect,
                              initialColor = '#6c757d',
                              title = 'Select Color',
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
    const {t} = useI18n();
    const colorInputRef = useRef(null);

    // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ СЛАЙДЕРА ---
    const [activeHslBase, setActiveHslBase] = useState(null); // [h, s, l] базового цвета
    const [brightness, setBrightness] = useState(50); // 0-100 для слайдера

    const themeAwareGlobalColor = useMemo(() => {
        if (shiftObject) {
            return ThemeColorService.getShiftColor({
                ...shiftObject,
                color: originalGlobalColor
            }, currentTheme, userRole);
        }
        return originalGlobalColor || '#6c757d';
    }, [shiftObject, originalGlobalColor, currentTheme, userRole]);

    const hasActiveLocalColor = selectedColor !== themeAwareGlobalColor;

    useEffect(() => {
        if (show) {
            updateColorAndSlider(initialColor);
        }
    }, [show, initialColor]);

    const updateColorAndSlider = (newColor) => {
        const hsl = hexToHsl(newColor);
        setActiveHslBase(hsl);
        // Инвертированная логика: HSL lightness 1.0 (ярко) = слайдер 0.
        setBrightness(100 - Math.round(hsl[2] * 100));
        setSelectedColor(newColor);
        if (onColorChange) {
            onColorChange(newColor);
        }
    };

    const handleSaveAndClose = () => {
        if (onColorSelect) {
            onColorSelect(selectedColor);
        }
        onHide();
    };

    const handleCancelAndClose = () => {
        if (onColorChange) {
            onColorChange(initialColor);
        }
        onHide();
    };

    const handleReset = () => {
        if (onResetColor) {
            const newColor = onResetColor();
            if (newColor) {
                updateColorAndSlider(newColor);
            }
        }
    };
    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ИЗМЕНЕНИЯ ЯРКОСТИ ---
    const handleBrightnessChange = (e) => {
        const sliderValue = parseInt(e.target.value, 10);
        setBrightness(sliderValue);

        const newLightness = (100 - sliderValue) / 100;

        const newHexColor = hslToHex(activeHslBase[0], activeHslBase[1], newLightness);
        setSelectedColor(newHexColor);
        if (onColorChange) {
            onColorChange(newHexColor);
        }
    };

    return (
        <Modal
            show={show}
            onHide={handleSaveAndClose}
            dialogClassName="bottom-sheet"
            backdropClassName="bottom-sheet-backdrop"
            contentClassName="shadow-lg"
            className="color-picker-modal"
        >
            <Container className="pt-2 pb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 ms-2">{title}</h6>
                    <Button variant="light" className="rounded-circle" onClick={handleCancelAndClose}>
                        <i className="bi bi-x-lg"></i>
                    </Button>
                </div>

                <div className={`alert ${saveMode === 'local' ? 'alert-info' : 'alert-success'} py-2 px-3 mb-3 small`}>
                    <small className="d-flex align-items-center justify-content-between">
                        <span>
                            <i className={`bi ${saveMode === 'local' ? 'bi-person' : 'bi-globe'} me-1`}></i>
                            {saveMode === 'local' ? t('color.savingLocally', {theme: t(`theme.${currentTheme}`)}) : t('color.savingGlobally')}
                        </span>
                    </small>
                </div>

                <Row className="gx-0 align-items-center mb-2">
                    <div
                        className="color-preview-button"
                        style={{
                            backgroundColor: selectedColor,
                            color: getContrastTextColor(selectedColor, isDarkTheme())
                        }}
                        onClick={() => colorInputRef.current?.click()}
                    >
                        {t('color.pickColor')}
                        <i className="bi bi-eyedropper ms-2"></i>
                    </div>
                    <input
                        type="color"
                        ref={colorInputRef}
                        value={selectedColor}
                        onChange={(e) => updateColorAndSlider(e.target.value)}
                        style={{opacity: 0, position: 'absolute', width: 0, height: 0, border: 'none', padding: 0}}
                    />
                </Row>

                <Row className="d-flex justify-content-between align-items-center small text-muted">
                    <Col xs="auto" >
                        <label>{t('color.quickColors')}</label>
                    </Col>

                        {saveMode === 'local' && currentTheme === 'light' && hasActiveLocalColor && (
                            <Col xs="auto" className="d-flex align-items-center">
                                <i className="bi bi-globe small me-1 mt-0"></i>
                                <span className="me-2">{t('color.globalColorIs')}:</span>
                                <div className="global-color-swatch"
                                     style={{backgroundColor: themeAwareGlobalColor}}></div>
                                {saveMode === 'local' && hasLocalColor && onResetColor && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className=" text-decoration-none py-0 reset-color-btn"
                                        onClick={handleReset}
                                        title={t('color.resetToGlobal')}
                                    >
                                        <i className="bi bi-arrow-counterclockwise text-warning"></i>
                                    </Button>
                                )}
                            </Col>
                        )}

                </Row>
                <div className="g-1 align-items-center preset-colors-wrapper my-2 py-1">
                    {PRESET_COLORS.map(color => (
                        <Col xs="auto" key={color}>
                            <button
                                className="color-preset-btn flex-shrink-0"
                                style={{
                                    backgroundColor: color,
                                    borderColor: selectedColor === color ? '#43a1ff' : '#dee2e6',
                                    borderWidth: selectedColor === color ? '2px' : '1px'
                                }}
                                onClick={() => updateColorAndSlider(color)}
                            />
                        </Col>
                    ))}
                </div>
                <div className="brightness-slider-container">
                    <Form.Range
                        min="0"
                        max="100"
                        step="1"
                        value={brightness}
                        onChange={handleBrightnessChange}
                        className="brightness-slider"
                    />
                </div>
                <Row className="g-2 align-items-center small text-muted justify-content-between mb-2">

                </Row>
            </Container>
        </Modal>
    )
        ;
};

export default ColorPickerModal;