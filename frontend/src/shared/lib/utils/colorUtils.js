// frontend/src/shared/lib/utils/colorUtils.js

/**
 * Определяет контрастный цвет текста для заданного фона
 * @param {string} backgroundColor - HEX цвет фона
 * @param {boolean} isDarkTheme - Используется ли тёмная тема
 * @returns {string} - '#000000' или '#ffffff'
 */
export const getContrastTextColor = (backgroundColor, isDarkTheme = false) => {
    if (!backgroundColor) return isDarkTheme ? '#ffffff' : '#000000';

    // Убираем # если есть
    const hex = backgroundColor.replace('#', '');

    // Конвертируем в RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Вычисляем яркость по формуле
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Для тёмной темы порог яркости другой
    const threshold = isDarkTheme ? 150 : 128;
    return brightness > threshold ? '#000000' : '#ffffff';
};

/**
 * Проверяет, используется ли тёмная тема
 * @returns {boolean}
 */
export const isDarkTheme = () => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
};

/**
 * Добавляет прозрачность к HEX цвету
 * @param {string} color - HEX цвет
 * @param {number} opacity - Прозрачность от 0 до 1
 * @returns {string} - Цвет с прозрачностью
 */
export const hexToRgba = (color, opacity = 1) => {
    if (!color) return `rgba(0, 0, 0, ${opacity})`;

    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Lightens a color (useful for backgrounds)
 * @param {string} color - HEX color
 * @param {number} amount - Amount to lighten (0-100)
 * @returns {string} - Lightened color
 */
export const lightenColor = (color, amount = 20) => {
    if (!color) return '#f8f9fa';

    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * amount);

    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
};