// frontend/src/shared/ui/components/ColorPickerModal/ColorPickerModal.js
import React, {useState, useEffect} from 'react';
import {Modal, Button, Container, Col, Row} from 'react-bootstrap';
import {useI18n} from "shared/lib/i18n/i18nProvider";
import './ColorPickerModal.css';
import {getContrastTextColor, isDarkTheme} from "shared/lib/utils/colorUtils";

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
    const [originalColorOnOpen, setOriginalColorOnOpen] = useState(initialColor);
    const {t} = useI18n();

    useEffect(() => {
        if (show) {
            // Когда модал открывается, запоминаем текущий цвет
            setOriginalColorOnOpen(initialColor);
            setSelectedColor(initialColor);
        }
    }, [show, initialColor]);

    const handleColorChange = (color) => {
        setSelectedColor(color);
        // Немедленно вызываем onColorSelect, чтобы применить цвет.
        // Это и есть "сохранение на лету".
        if (onColorSelect) {
            onColorSelect(color);
        }
        // onColorChange больше не нужен, но если он есть, вызовем и его.
        if (onColorChange) {
            onColorChange(color);
        }
    };

    // Просто закрывает шторку (сохраняя изменения)
    const handleClose = () => {
        // Здесь мы НЕ откатываем цвет. Изменения остаются.
        onHide();
    };

    // Отменяет изменения и закрывает шторку
    const handleCancelAndClose = () => {
        // Откатываем цвет к тому, который был при открытии
        // и СОХРАНЯЕМ этот откат.
        if (onColorSelect) {
            onColorSelect(originalColorOnOpen);
        }
        if (onColorChange) { // для превью
            onColorChange(originalColorOnOpen);
        }
        // И после отката закрываем.
        onHide();
    };
    const handleReset = () => {
        if (onResetColor) {
            // Вызываем колбэк и СРАЗУ ЖЕ получаем новый цвет
            const newColor = onResetColor();

            // Обновляем состояние модала этим новым цветом
            setSelectedColor(newColor);

            // И также обновляем превью в таблице
            if (onColorChange) {
                onColorChange(newColor);
            }
        }
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
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
                    {saveMode === 'local' && hasLocalColor && originalGlobalColor && (
                        <Col xs="auto" className="d-flex align-items-center">
                            <i className="bi bi-globe me-1"></i>
                            <span className="me-2">{t('color.globalColorIs')}:</span>
                            <div className="global-color-swatch" style={{backgroundColor: originalGlobalColor}}></div>
                            {/* Кнопка сброса для локальных настроек */}
                            {saveMode === 'local' && hasLocalColor && onResetColor && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className=" text-decoration-none"
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
                    {/*<Col>*/}
                    {/*    <div className="color-preview" style={{*/}
                    {/*        backgroundColor: selectedColor,*/}
                    {/*        color: getContrastTextColor(selectedColor, isDarkTheme())*/}
                    {/*    }}*/}
                    {/*    >*/}
                    {/*        {t('color.sampleText')}*/}
                    {/*    </div>*/}
                    {/*</Col>*/}
                    <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="form-control form-control-color"
                    />

                </Row>



            </Container>
        </Modal>
    );
};

export default ColorPickerModal;