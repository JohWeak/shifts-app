// frontend/src/shared/lib/services/ThemeColorService.js
/**
 * Сервис для управления цветами смен.
 * Обеспечивает иерархию цветов: localStorage > цвет из БД > цвет по умолчанию.
 * Обрабатывает разные темы и роли пользователей.
 */

class ThemeColorService {
    // --- 1. КОНСТАНТЫ: Все "магические строки" вынесены сюда ---

    /** @type {string} Ключ для хранения цветов пользователя. */
    static STORAGE_KEY = 'user_theme_colors';
    /** @type {string} Отдельный ключ для настроек темной темы админа. */
    static ADMIN_DARK_KEY = 'admin_dark_theme_colors';

    /** @type {string} Цвет по умолчанию для светлой темы. */
    static DEFAULT_COLOR_LIGHT = '#a3a9ae'; // Серый
    /** @type {string} Цвет по умолчанию для темной темы. */
    static DEFAULT_COLOR_DARK = '#495057'; // Темно-серый

    /** @type {string} Цвет для выходного дня в светлой теме. */
    static DAY_OFF_COLOR_LIGHT = '#f8f9fa'; // Почти белый
    /** @type {string} Цвет для выходного дня в темной теме. */
    static DAY_OFF_COLOR_DARK = '#343a40'; // Очень темно-серый

    /**
     * Получает объект с цветами из localStorage для указанной темы и роли.
     * @param {('light'|'dark'|'all')} theme - Тема, для которой нужны цвета, или 'all' для всех.
     * @param {boolean} isAdminDarkTheme - Флаг, указывающий, нужно ли читать из хранилища админа.
     * @returns {object} - Объект с цветами или пустой объект.
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
            return {}; // Возвращаем пустой объект в случае ошибки парсинга
        }
    }

    /**
     * Устанавливает кастомный цвет для смены в localStorage.
     * @param {string|number} shiftId - ID смены.
     * @param {string} color - HEX-код цвета.
     * @param {'light'|'dark'} theme - Тема, для которой сохраняется цвет.
     * @param {boolean} isAdminDarkTheme - Флаг для сохранения в хранилище админа.
     */
    static setColor(shiftId, color, theme = 'light', isAdminDarkTheme = false) {
        const storageKey = isAdminDarkTheme ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;
        const allData = this.getColors('all', isAdminDarkTheme);

        if (!allData[theme]) {
            allData[theme] = {};
        }
        allData[theme][shiftId] = color;

        localStorage.setItem(storageKey, JSON.stringify(allData));
    }


    /**
     * Получает финальный цвет для смены с учетом всех приоритетов.
     * @param {object} shift - Объект смены (должен содержать id/shift_id и опционально color).
     * @param {'light'|'dark'} theme - Текущая тема.
     * @param {('employee'|'admin')} userRole - Роль текущего пользователя.
     * @returns {string} - Финальный HEX-код цвета.
     */
    static getShiftColor(shift, theme, userRole = 'employee') {
        // --- 2. ЧИТАЕМОСТЬ: Паттерн "раннего возврата" ---

        // Защита от отсутствия объекта смены
        if (!shift) {
            return this.DEFAULT_COLOR_LIGHT;
        }

        const shiftId = shift.id || shift.shift_id;
        const isAdmin = userRole === 'admin';

        // Приоритет 1: Личные настройки пользователя (только для не-админов)
        if (!isAdmin) {
            const userColors = this.getColors(theme, false);
            if (userColors[shiftId]) {
                return userColors[shiftId];
            }
        }

        // Приоритет 2: Кастомные настройки админа для темной темы
        if (theme === 'dark') {
            const adminDarkColors = this.getColors('dark', true);
            if (adminDarkColors[shiftId]) {
                return adminDarkColors[shiftId];
            }
        }

        // Приоритет 3: Особый случай для выходного дня
        if (shiftId === 'day_off') {
            return theme === 'dark' ? this.DAY_OFF_COLOR_DARK : this.DAY_OFF_COLOR_LIGHT;
        }

        // Приоритет 4: Цвет из базы данных
        if (shift.color) {
            return shift.color;
        }

        // Приоритет 5: Фоллбэк (цвет по умолчанию для темы)
        return theme === 'dark' ? this.DEFAULT_COLOR_DARK : this.DEFAULT_COLOR_LIGHT;
    }

    // Проверить наличие кастомных цветов
    static hasCustomColors(theme = 'light', isAdmin = false) {
        const colors = this.getColors(theme, isAdmin);
        return Object.keys(colors).length > 0;
    }

    // Очистить цвета
    static clearColors(theme = null, isAdmin = false) {
        const storageKey = isAdmin ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;

        if (!theme) {
            localStorage.removeItem(storageKey);
        } else {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                delete data[theme];
                localStorage.setItem(storageKey, JSON.stringify(data));
            }
        }
    }

    // Экспорт/импорт настроек
    static exportSettings() {
        return {
            userColors: localStorage.getItem(this.STORAGE_KEY),
            adminDarkColors: localStorage.getItem(this.ADMIN_DARK_KEY)
        };
    }

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