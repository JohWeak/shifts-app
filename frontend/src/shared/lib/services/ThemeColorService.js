// frontend/src/shared/lib/services/ThemeColorService.js
/**
 * A service for managing shift colors.
 * It ensures a color hierarchy: localStorage override > database color > default color.
 * It also handles different themes and user roles.
 */
class ThemeColorService {
    // --- 1. CONSTANTS: All "magic strings" are defined here ---

    /** @type {string} The key for storing user-defined theme colors. */
    static STORAGE_KEY = 'user_theme_colors';
    /** @type {string} A separate key for the admin's dark theme settings. */
    static ADMIN_DARK_KEY = 'admin_dark_theme_colors';

    /** @type {string} The default color for the light theme. */
    static DEFAULT_COLOR_LIGHT = '#a3a9ae'; // Gray
    /** @type {string} The default color for the dark theme. */
    static DEFAULT_COLOR_DARK = '#495057'; // Dark Gray

    /** @type {string} The color for a day off in the light theme. */
    static DAY_OFF_COLOR_LIGHT = '#f8f9fa'; // Almost white
    /** @type {string} The color for a day off in the dark theme. */
    static DAY_OFF_COLOR_DARK = '#343a40'; // Very Dark Gray

    /**
     * Retrieves the color object from localStorage for the specified theme and role.
     * @param {('light'|'dark'|'all')} theme - The theme for which colors are needed, or 'all' for all themes.
     * @param {boolean} isAdminDarkTheme - A flag indicating whether to read from the admin's storage.
     * @returns {object} An object of colors or an empty object.
     */
    static getColors(theme = 'light', isAdminDarkTheme = false) {
        const storageKey = isAdminDarkTheme ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;
        const stored = localStorage.getItem(storageKey);

        if (!stored) return {};

        try {
            const parsed = JSON.parse(stored);
            return theme === 'all' ? parsed : (parsed[theme] || {});
        } catch (error) {
            console.error('Failed to parse theme colors from localStorage:', error);
            return {}; // Return an empty object on parsing error
        }
    }

    /**
     * Sets a custom color for a shift in localStorage.
     * @param {string|number} shiftId - The ID of the shift.
     * @param {string} color - The HEX color code.
     * @param {'light'|'dark'} theme - The theme for which the color is being saved.
     * @param {boolean} isAdminDarkTheme - A flag to save to the admin's storage.
     */
    static setColor(shiftId, color, theme = 'light', isAdminDarkTheme = false) {
        const storageKey = isAdminDarkTheme ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;
        const allData = this.getColors('all', isAdminDarkTheme);

        if (!allData[theme]) {
            allData[theme] = {};
        }
        allData[theme][String(shiftId)] = color;

        localStorage.setItem(storageKey, JSON.stringify(allData));
    }

    /**
     * Removes a custom color for a shift from localStorage.
     * @param {string|number} shiftId - The ID of the shift.
     * @param {'light'|'dark'} theme - The theme from which to remove the color.
     * @param {boolean} isAdminDarkTheme - A flag to remove from the admin's storage.
     */
    static removeColor(shiftId, theme = 'light', isAdminDarkTheme = false) {
        const storageKey = isAdminDarkTheme ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;
        const allData = this.getColors('all', isAdminDarkTheme);

        // If the theme or shift color doesn't exist, there's nothing to do.
        if (!allData[theme] || !allData[theme][String(shiftId)]) {
            return;
        }

        // Delete the specific shift color
        delete allData[theme][String(shiftId)];

        // Clean up: if the theme object is now empty, remove it.
        if (Object.keys(allData[theme]).length === 0) {
            delete allData[theme];
        }

        // Clean up: if the entire data object is now empty, remove the key from localStorage.
        if (Object.keys(allData).length === 0) {
            localStorage.removeItem(storageKey);
        } else {
            localStorage.setItem(storageKey, JSON.stringify(allData));
        }
    }


    /**
     * Gets the final display color for a shift, considering all priorities.
     * @param {object} shift - The shift object (must contain id/shift_id and optionally a color property).
     * @param {'light'|'dark'} theme - The current theme.
     * @param {('employee'|'admin')} [userRole='employee'] - The role of the current user.
     * @returns {string} The final HEX color code.
     */
    static getShiftColor(shift, theme, userRole = 'employee') {
        // --- 2. READABILITY: Using the "early return" pattern ---

        // Guard against a missing shift object
        if (!shift) {
            return theme === 'dark' ? this.DEFAULT_COLOR_DARK : this.DEFAULT_COLOR_LIGHT;
        }

        const shiftId = shift.id || shift.shift_id;
        const isAdmin = userRole === 'admin';
        const shiftIdKey = String(shiftId);

        // Priority 1: User's personal settings (for both themes, but only for non-admins)
        if (!isAdmin) {
            const userColors = this.getColors(theme, false);
            if (userColors[shiftIdKey]) {
                return userColors[shiftIdKey];
            }
        }

        // Priority 2: Admin's custom settings for the dark theme
        if (isAdmin && theme === 'dark') {
            const adminDarkColors = this.getColors('dark', true);
            if (adminDarkColors[shiftIdKey]) {
                return adminDarkColors[shiftIdKey];
            }
        }

        // Priority 3: Special case for a "day off" slot
        if (shiftId === 'day_off') {
            return theme === 'dark' ? this.DAY_OFF_COLOR_DARK : this.DAY_OFF_COLOR_LIGHT;
        }

        // Priority 4: The color from the database
        if (shift.color) {
            return shift.color;
        }

        // Priority 5: Fallback (the default color for the current theme)
        return theme === 'dark' ? this.DEFAULT_COLOR_DARK : this.DEFAULT_COLOR_LIGHT;
    }

    /**
     * Checks if any custom colors are stored for a given theme and role.
     * @param {'light'|'dark'} theme - The theme to check.
     * @param {boolean} isAdminDarkTheme - Flag to check the admin's storage.
     * @returns {boolean}
     */
    static hasCustomColors(theme = 'light', isAdminDarkTheme = false) {
        const colors = this.getColors(theme, isAdminDarkTheme);
        return Object.keys(colors).length > 0;
    }

    /**
     * Clears all custom colors for a theme or for all themes.
     * @param {('light'|'dark'|null)} [theme=null] - The theme to clear, or null to clear everything.
     * @param {boolean} isAdminDarkTheme - Flag to clear the admin's storage.
     */
    static clearColors(theme = null, isAdminDarkTheme = false) {
        const storageKey = isAdminDarkTheme ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;

        if (!theme) {
            localStorage.removeItem(storageKey);
        } else {
            const allData = this.getColors('all', isAdminDarkTheme);
            if (allData[theme]) {
                delete allData[theme];
                localStorage.setItem(storageKey, JSON.stringify(allData));
            }
        }
    }

    /**
     * Exports all color settings as a JSON-compatible object.
     * @returns {{userColors: string|null, adminDarkColors: string|null}}
     */
    static exportSettings() {
        return {
            userColors: localStorage.getItem(this.STORAGE_KEY),
            adminDarkColors: localStorage.getItem(this.ADMIN_DARK_KEY)
        };
    }

    /**
     * Imports color settings from a previously exported object.
     * @param {{userColors: string|null, adminDarkColors: string|null}} settings
     */
    static importSettings(settings) {
        if (settings.userColors) {
            localStorage.setItem(this.STORAGE_KEY, settings.userColors);
        }
        if (settings.adminDarkColors) {
            localStorage.setItem(this.ADMIN_DARK_KEY, settings.adminDarkColors);
        }
    }
}

export default ThemeColorService;