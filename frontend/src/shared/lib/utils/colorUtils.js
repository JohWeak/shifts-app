// frontend/src/shared/lib/utils/colorUtils.js

/**
 * Determines a contrasting text color for a given background color.
 * @param {string} backgroundColor - The background color in HEX format.
 * @param {boolean} isDarkTheme - Whether a dark theme is being used.
 * @returns {string} - '#000000' or '#ffffff'.
 */
export const getContrastTextColor = (backgroundColor, isDarkTheme = false) => {
    if (!backgroundColor) return isDarkTheme ? '#ffffff' : '#000000';

    const hex = backgroundColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness using the formula
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // The brightness threshold is different for a dark theme
    const threshold = isDarkTheme ? 150 : 128;
    return brightness > threshold ? '#000000' : '#ffffff';
};

/**
 * Checks if a dark theme is being used.
 * @returns {boolean}
 */
export const isDarkTheme = () => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
};

/**
 * Converts a HEX color to RGBA format.
 * @param {string} hex - The color in #RRGGBB format.
 * @param {number} alpha - The opacity, from 0 to 1.
 * @returns {string} - The color in rgba(r, g, b, a) format.
 */
export const hexToRgba = (hex, alpha) => {
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return ''; // Return an empty string for an invalid hex value
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
 * Converts a HEX color to HSL.
 * @param {string} hex - The color in HEX format (e.g., '#ff0000').
 * @returns {Array<number>} An array [hue, saturation, lightness].
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
        // eslint-disable-next-line default-case
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l];
};

/**
 * Converts an HSL color to HEX.
 * @param {number} h - Hue (from 0 to 1).
 * @param {number} s - Saturation (from 0 to 1).
 * @param {number} l - Lightness (from 0 to 1).
 * @returns {string} The color in HEX format.
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