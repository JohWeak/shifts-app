// frontend/src/shared/ui/components/ColorPickerModal/ColorPickerModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
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
                              onColorChange = null // Callback для изменения цвета на лету
                          }) => {
    const [selectedColor, setSelectedColor] = useState(initialColor);

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

    return (
        <Modal
            show={show}
            onHide={handleCancel}
            size="sm"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-palette me-2"></i>
                    {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Preset colors */}
                <div className="mb-3">
                    <label className="form-label small text-muted">Quick colors:</label>
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
                        <label className="form-label small text-muted">Preview:</label>
                        <div
                            className="color-preview"
                            style={{ backgroundColor: selectedColor }}
                        >
                            Sample Text
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit}>
                    <i className="bi bi-check me-1"></i>
                    Apply Color
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ColorPickerModal;