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
 * Конвертирует HEX цвет в RGBA формат.
 * @param {string} hex - Цвет в формате #RRGGBB.
 * @param {number} alpha - Прозрачность от 0 до 1.
 * @returns {string} - Цвет в формате rgba(r, g, b, a).
 */
export const hexToRgba = (hex, alpha) => {
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return ''; // Возвращаем пустую строку при некорректном hex
    }
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

/**
 * Преобразует HEX цвет в HSL.
 * @param {string} hex - Цвет в формате HEX (например, '#ff0000').
 * @returns {Array<number>} Массив [hue, saturation, lightness].
 */
export const hexToHsl = (hex) => {
    if (!hex) return [0, 0, 0];
    let r = parseInt(hex.substring(1, 3), 16) / 255;
    let g = parseInt(hex.substring(3, 5), 16) / 255;
    let b = parseInt(hex.substring(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
};

/**
 * Преобразует HSL цвет в HEX.
 * @param {number} h - Hue (от 0 до 1).
 * @param {number} s - Saturation (от 0 до 1).
 * @param {number} l - Lightness (от 0 до 1).
 * @returns {string} Цвет в формате HEX.
 */
export const hslToHex = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

