// frontend/src/shared/lib/services/ThemeColorService.js
// Новый сервис для управления локальными цветами

class ThemeColorService {
    static STORAGE_KEY = 'user_theme_colors';
    static ADMIN_DARK_KEY = 'admin_dark_theme_colors'; // Для админских настроек темной темы

    // Получить цвета для конкретной темы и роли
    static getColors(theme = 'light', isAdmin = false) {
        const storageKey = isAdmin && theme === 'dark' ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;
        const stored = localStorage.getItem(storageKey);
        if (!stored) return {};

        const parsed = JSON.parse(stored);
        return theme === 'all' ? parsed : (parsed[theme] || {});
    }

    // Установить цвет для смены
    static setColor(shiftId, color, theme = 'light', isAdmin = false) {
        const storageKey = isAdmin && theme === 'dark' ? this.ADMIN_DARK_KEY : this.STORAGE_KEY;
        const stored = localStorage.getItem(storageKey);
        const data = stored ? JSON.parse(stored) : {};

        if (!data[theme]) data[theme] = {};
        data[theme][shiftId] = color;

        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    // Получить цвет смены с учетом всех источников
    static getShiftColor(shift, theme, userRole = 'employee') {
        // Приоритеты:
        // 1. Локальные настройки пользователя (для всех)
        // 2. Локальные настройки админа для темной темы
        // 3. Глобальный цвет из БД

        // Если это "смена" выходного дня, у нее нет цвета в БД.
        if (shift.shift_id === 'day_off') {
            // Возвращаем дефолтный цвет для выходного в зависимости от темы
            return theme === 'dark' ? '#343a40' : '#f8f9fa'; // Темно-серый или светло-серый
        }

        // Проверяем личные настройки пользователя
        const userColors = this.getColors(theme, false);
        if (userColors[shift.shift_id]) {
            return userColors[shift.shift_id];
        }

        // Для темной темы проверяем админские локальные настройки
        if (theme === 'dark') {
            const adminDarkColors = this.getColors('dark', true);
            if (adminDarkColors[shift.shift_id]) {
                return adminDarkColors[shift.shift_id];
            }
        }

        // Возвращаем глобальный цвет из БД
        return shift.color || '#6c757d';
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