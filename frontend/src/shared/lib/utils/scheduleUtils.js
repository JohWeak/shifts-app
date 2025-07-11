// frontend/src/shared/lib/utils/scheduleUtils.js
import { format, addDays, parseISO, isValid, startOfWeek, endOfWeek } from 'date-fns';
/**
 * Получает день начала недели из настроек системы
 */
export const getWeekStartDay = (systemSettings) => {
    return systemSettings?.weekStartDay ?? 0; // По умолчанию воскресенье
};

/**
 * Получает дату начала следующей недели на основе текущей даты
 * @param {string} currentWeekStartDate - Дата начала текущей недели в формате ISO
 * @returns {string} - Дата начала следующей недели в формате 'YYYY-MM-DD'
 */
export const getNextWeekStartDate = (currentWeekStartDate) => {
    const date = parseISO(currentWeekStartDate);
    const nextWeekDate = addDays(date, 7);
    return format(nextWeekDate, 'yyyy-MM-dd'); // Возвращаем в нужном для API формате
};

/**
 * Проверяет, является ли дата началом недели
 */
export const isValidWeekStartDate = (date, weekStartDay = 0) => {
    if (!date) return false;
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) return false;
    return dateObj.getDay() === weekStartDay;
};

/**
 * Получает дату начала следующей недели
 */
export const getNextWeekStart = (weekStartDay = 0) => {
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilStart;
    if (currentDay === weekStartDay) {
        daysUntilStart = 7; // Следующая неделя
    } else {
        daysUntilStart = (weekStartDay - currentDay + 7) % 7;
    }

    if (daysUntilStart === 0) {
        daysUntilStart = 7;
    }

    return addDays(today, daysUntilStart);
};

/**
 * Получает массив дат для недели
 */
export const getWeekDates = (startDate, weekStartDay = 0) => {
    const start = parseISO(startDate);
    const dates = [];

    let currentDate = start;
    if (currentDate.getDay() !== weekStartDay) {
        const diff = (weekStartDay - currentDate.getDay() + 7) % 7;
        currentDate = addDays(currentDate, diff);
    }

    for (let i = 0; i < 7; i++) {
        dates.push(addDays(currentDate, i));
    }

    return dates;
};

/**
 * Форматирует диапазон дат расписания
 */
export const formatScheduleDate = (startDate, endDate = null) => {
    if (!startDate) return '-';

    try {
        const start = parseISO(startDate);
        if (endDate) {
            const end = parseISO(endDate);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return format(start, 'MMM d, yyyy');
    } catch {
        return startDate;
    }
};

/**
 * Форматирует время смены (например: "06:00-14:00")
 * @param {string} startTime - Время начала в формате "HH:MM:SS"
 * @param {number} duration - Длительность в часах
 * @returns {string} - Отформатированное время
 */
export const formatShiftTime = (startTime, duration) => {
    if (!startTime) return '';

    const durationHours = typeof duration === 'number' ? duration : parseFloat(duration) || 0;

    const cleanStart = startTime.substring(0, 5);
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (duration * 60);

    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    const cleanEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    return `${cleanStart}-${cleanEnd}`;
};

/**
 * Форматирует дату для заголовка расписания
 * @param {Date} date - Дата
 * @returns {string} - Отформатированная дата
 */
export const formatHeaderDate = (date) => {
    return format(date,  'dd/MM');
};

/**
 * Получает локализованные названия дней недели
 * @param {function} t - Функция перевода
 * @param {boolean} short - Использовать короткие названия
 * @returns {string[]} - Массив названий дней
 */
export const getDayNames = (t, short = false) => {
    const prefix = short ? 'days.short.' : 'days.';
    return [
        t(`${prefix}sunday`),
        t(`${prefix}monday`),
        t(`${prefix}tuesday`),
        t(`${prefix}wednesday`),
        t(`${prefix}thursday`),
        t(`${prefix}friday`),
        t(`${prefix}saturday`)
    ];
};

/**
 * Получает название дня по индексу
 * @param {number} dayIndex - Индекс дня (0-6)
 * @param {function} t - Функция перевода
 * @param {boolean} short - Использовать короткое название
 * @returns {string} - Название дня
 */
export const getDayName = (dayIndex, t, short = false) => {
    const dayNames = getDayNames(t, short);
    return dayNames[dayIndex] || '';
};

// Оставляем эти функции, так как они используются
export const getStatusBadgeVariant = (status) => {
    const variants = {
        published: 'success',
        draft: 'warning',
        archived: 'secondary',
        active: 'success',
        admin: 'danger'
    };
    return variants[status] || 'secondary';
};
/**
 * Форматирует диапазон дат недели для заголовка.
 * Принимает объект week из ответа API.
 * @param {object} week - Объект { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 * @returns {string} - Отформатированная строка, например "Jul 15 - Jul 21, 2024"
 */
export const formatWeekRange = (week) => {
    if (!week || !week.start || !week.end) return '';
    try {
        const start = parseISO(week.start);
        const end = parseISO(week.end);
        // Проверяем, в одном ли году даты, для красивого форматирования
        if (start.getFullYear() === end.getFullYear()) {
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
        }
    } catch {
        return `${week.start} - ${week.end}`;
    }
};
export const canDeleteSchedule = (schedule) => {
    return schedule.status !== 'published';
};
/**
 * Форматирует имя сотрудника
 * @param {string} firstName - Имя
 * @param {string} lastName - Фамилия
 * @param {boolean} firstNameOnly - Показывать только имя
 * @returns {string} - Отформатированное имя
 */
export const formatEmployeeName = (firstName, lastName, firstNameOnly = false) => {
    if (!firstName && !lastName) return '-';
    if (firstNameOnly) {
        return firstName || lastName || '-';
    }
    return `${firstName || ''} ${lastName || ''}`.trim();
};