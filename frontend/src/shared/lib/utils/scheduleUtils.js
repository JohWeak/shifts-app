// frontend/src/shared/lib/utils/scheduleUtils.js
import { format, addDays, parseISO, isValid, startOfWeek, endOfWeek } from 'date-fns';
import { enUS, he, ru } from 'date-fns/locale'; // Пример для en, he, ru
const dateFnsLocales = {
    en: enUS,
    he: he,
    ru: ru
};
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
 * Превращает первую букву строки в заглавную.
 * @param {string} str - Входящая строка.
 * @returns {string} - Строка с заглавной первой буквой.
 */
export const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Форматирует диапазон дат недели с учетом локализации.
 * @param {object} week - Объект недели с { start, end }.
 * @param {string} currentLocale - Строка текущего языка ('en', 'he', 'ru').
 * @returns {string} - Отформатированная строка.
 */
export const formatWeekRange = (week, currentLocale = 'en') => {
    if (!week || !week.start || !week.end) return '';

    // Получаем нужный объект локали из нашей карты, или английский по умолчанию
    const locale = dateFnsLocales[currentLocale] || enUS;

    try {
        const start = parseISO(week.start);
        const end = parseISO(week.end);

        // Используем гибкий формат 'LLLL d', который date-fns сама адаптирует под язык.
        // 'LLLL' -> полное название месяца ('January', 'Январь', 'ינואר')
        // 'MMM' -> сокращенное название ('Jan', 'Янв', 'ינו')
        // Используй 'LLLL' для полной локализации.
        const monthDayFormat = 'LLLL d';

        if (start.getFullYear() === end.getFullYear()) {
            // Форматируем с учетом локали
            const startFormatted = capitalizeFirstLetter(format(start, 'LLLL d', { locale }));
            const endFormatted = capitalizeFirstLetter(format(end, 'LLLL d, yyyy', { locale }));
            return `${startFormatted} - ${endFormatted}`;
        } else {
            return `${format(start, 'LLLL d, yyyy', { locale })} - ${format(end, 'LLLL d, yyyy', { locale })}`;
        }
    } catch {
        // Фоллбэк остается без изменений
        return `${week.start} - ${week.end}`;
    }
};

export const canDeleteSchedule = (schedule) => {
    return schedule.status !== 'published';
};
/**
 * Форматирует имя сотрудника с учетом различных опций.
 * @param {object | string} employeeOrFirstName - Объект сотрудника или имя.
 * @param {object | string} [optionsOrLastName] - Объект опций или фамилия.
 * @param {boolean} [legacyShowFullName] - (Для совместимости) Флаг полного имени.
 * @returns {string} - Отформатированное имя.
 */
export const formatEmployeeName = (employeeOrFirstName, optionsOrLastName = {}, legacyShowFullName = false) => {
    if (typeof employeeOrFirstName === 'string') {
        // --- РЕЖИМ ОБРАТНОЙ СОВМЕСТИМОСТИ ---
        const firstName = employeeOrFirstName;
        const lastName = typeof optionsOrLastName === 'string' ? optionsOrLastName : '';
        const showFullName = legacyShowFullName;

        if (!firstName && !lastName) return '-';
        if (showFullName) {
            return `${firstName || ''} ${lastName || ''}`.trim();
        }
        return firstName || lastName || '-';
    }

    // --- НОВЫЙ РЕЖИМ РАБОТЫ С ОБЪЕКТАМИ ---
    const employee = employeeOrFirstName;
    const {
        showFullName = false,
        checkDuplicates = false,
        contextEmployees = []
    } = optionsOrLastName;

    if (!employee) return '-';

    // Извлекаем имена из разных возможных полей
    const fullName = employee.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const firstName = employee.first_name || fullName.split(' ')[0] || '';
    const lastName = employee.last_name || fullName.split(' ').slice(1).join(' ') || '';

    if (!firstName && !lastName) return '-';

    // Если нужно полное имя, возвращаем его
    if (showFullName) {
        return fullName;
    }

    // --- ЛОГИКА ПРОВЕРКИ ДУБЛИКАТОВ ---
    // Она сработает, только если переданы нужные опции
    if (checkDuplicates && contextEmployees.length > 0) {
        const duplicateNames = contextEmployees.filter(emp =>
            (emp.first_name || emp.employee_name?.split(' ')[0]) === firstName
        );

        if (duplicateNames.length > 1) {
            return `${firstName} ${lastName.charAt(0) || ''}.`.trim();
        }
    }

    // По умолчанию возвращаем только имя
    return firstName;
};