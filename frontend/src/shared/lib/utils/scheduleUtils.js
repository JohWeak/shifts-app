// frontend/src/shared/lib/utils/scheduleUtils.js
import {
    format,
    addDays,
    parseISO,
    isValid,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay
} from 'date-fns';
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
    return systemSettings?.weekStartDay ?? 0;
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
    let end = endDate;
    try {
        const start = parseISO(startDate);
        if (!endDate) {
             end = addDays(start, 6);
        }
        else {
             end = parseISO(endDate);
        }

        return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM, yyyy')}`;
    } catch {
        return startDate;
    }
};

/**
 * Форматирует диапазон времени смены (например: "06:00-14:00").
 * Может принимать либо длительность, либо время окончания.
 * @param {string} startTime - Время начала в формате "HH:MM:SS".
 * @param {number | string} endOrDuration - Длительность в часах (number) ИЛИ время окончания в формате "HH:MM:SS" (string).
 * @returns {string} - Отформатированное время.
 */
export const formatShiftTime = (startTime, endOrDuration) => {
    // Проверка на наличие базовых данных
    if (!startTime || !endOrDuration) return '';

    try {
        // Форматируем время начала (всегда нужно)
        const cleanStart = startTime.substring(0, 5);
        let cleanEnd;


        if (typeof endOrDuration === 'string' && endOrDuration.includes(':')) {
            // --- Сценарий 1: Передано startTime + endTime ---
            const endTime = endOrDuration;
            cleanEnd = endTime.substring(0, 5);

        } else {
            // --- Сценарий 2: Передано startTime + duration ---
            const duration = typeof endOrDuration === 'number'
                ? endOrDuration
                : parseFloat(endOrDuration);

            if (isNaN(duration)) {
                console.warn('Некорректная длительность в formatShiftTime:', endOrDuration);
                return cleanStart;
            }

            // Ваша оригинальная, рабочая логика для вычисления времени окончания
            const [hours, minutes] = startTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + (duration * 60);

            const endHours = Math.floor(endMinutes / 60) % 24;
            const endMins = endMinutes % 60;
            cleanEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        }

        return `${cleanStart}-${cleanEnd}`;

    } catch (error) {
        console.error("Ошибка при форматировании времени смены:", error);
        return startTime;
    }
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
 * Форматирует полную дату
 * @param {Date} date - Дата
 * @param {string} currentLocale - Строка текущего языка ('en', 'he', 'ru').
 * @returns {string} - Полная дата
 */
export const formatFullDate = (date, currentLocale ='en') => {
    const locale = dateFnsLocales[currentLocale] || enUS;
    return capitalizeFirstLetter(format(date, 'EEEE, d MMMM, yyyy', { locale }));
};

/**
 * Форматирует диапазон дат недели с учетом локализации.
 * @param {object|string} weekOrStartDate - Объект недели с { start, end } ИЛИ строка с датой начала недели ('YYYY-MM-DD').
 * @param {string} currentLocale - Строка текущего языка ('en', 'he', 'ru').
 * @returns {string} - Отформатированная строка.
 */
export const formatWeekRange = (weekOrStartDate, currentLocale = 'en') => {
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    let week;

    if (typeof weekOrStartDate === 'string') {
        // Если на вход пришла строка, считаем ее датой начала
        // и вычисляем конец недели (+6 дней)
        try {
            const start = parseISO(weekOrStartDate);
            const end = addDays(start, 6);
            week = { start, end };
        } catch {
            return ''; // Возвращаем пустоту в случае невалидной даты
        }
    } else if (weekOrStartDate && weekOrStartDate.start && weekOrStartDate.end) {
        // Если это объект, используем его как есть
        week = weekOrStartDate;
    } else {
        // Если входные данные некорректны
        return '';
    }

    const locale = dateFnsLocales[currentLocale] || enUS;

    try {
        // Теперь мы можем быть уверены, что week.start и week.end существуют
        const start = (week.start instanceof Date) ? week.start : parseISO(week.start);
        const end = (week.end instanceof Date) ? week.end : parseISO(week.end);

        if (!isValid(start) || !isValid(end)) return '';

        // Логика форматирования остается прежней
        if (start.getFullYear() === end.getFullYear()) {
            const startFormatted = capitalizeFirstLetter(format(start, 'd MMMM', { locale }));
            const endFormatted = format(end, 'd MMMM, yyyy', { locale });
            return `${startFormatted} - ${endFormatted}`;
        } else {
            const startFormatted = format(start, 'd MMMM, yyyy', { locale });
            const endFormatted = format(end, 'd MMMM, yyyy', { locale });
            return `${startFormatted} - ${endFormatted}`;
        }
    } catch {
        // Безопасный фолбэк
        const startStr = (week.start instanceof Date) ? format(week.start, 'yyyy-MM-dd') : week.start;
        const endStr = (week.end instanceof Date) ? format(week.end, 'yyyy-MM-dd') : week.end;
        return `${startStr} - ${endStr}`;
    }
};

export const canDeleteSchedule = (schedule) => {
    if (!schedule) return false;
    return ['draft', 'unpublished'].includes(schedule.status?.toLowerCase());
};

export const canPublishSchedule = (schedule) => {
    if (!schedule) return false;
    return schedule.status === 'draft';
};

export const canUnpublishSchedule = (schedule) => {
    if (!schedule) return false;
    return schedule.status === 'published';
};

export const canEditSchedule = (schedule) => {
    if (!schedule) return false;
    return schedule.status === 'draft';
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

/**
 * Форматирует часы из минут в формат ЧЧ:ММ
 * @param {number} minutes - Количество минут
 * @returns {string} - Отформатированное время
 */
export const formatMinutesToHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Получает список месяцев между двумя датами
 * @param {Date|string} startDate - Начальная дата
 * @param {Date|string} endDate - Конечная дата
 * @returns {Array} - Массив объектов с информацией о месяцах
 */
export const getMonthsBetweenDates = (startDate, endDate) => {
    const start = startDate instanceof Date ? startDate : parseISO(startDate);
    const end = endDate instanceof Date ? endDate : parseISO(endDate);

    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
        months.push({
            date: new Date(current),
            value: format(current, 'yyyy-MM'),
            label: format(current, 'MMMM yyyy')
        });
        current.setMonth(current.getMonth() + 1);
    }

    return months;
};

/**
 * Проверяет, есть ли у даты смена
 * @param {Date} date - Дата для проверки
 * @param {Array} shifts - Массив смен
 * @returns {Object|null} - Объект смены или null
 */
export const getShiftForDate = (date, shifts) => {
    if (!shifts || !Array.isArray(shifts)) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find(shift => shift.work_date === dateStr) || null;
};

/**
 * Форматирует месяц и год
 * @param {Date} date - Дата
 * @returns {string} - Отформатированный месяц и год
 */
export const formatMonthYear = (date) => {
    return format(date, 'MMMM yyyy');
};

/**
 * Получает все дни месяца
 * @param {Date} date - Любая дата в месяце
 * @returns {Array<Date>} - Массив дат месяца
 */
export const getMonthDays = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
};

/**
 * Форматирует число дня
 * @param {Date} date - Дата
 * @returns {string} - Число дня
 */
export const formatDayNumber = (date) => {
    return format(date, 'd');
};

/**
 * Форматирует дату и время с учетом локализации.
 * Возвращает строку вида "Month Day, Year, HH:MM".
 * @param {Date | string | number} dateInput - Входящая дата (объект Date, строка ISO, или timestamp).
 * @param {string} currentLocale - Строка текущего языка ('en', 'he', 'ru').
 * @returns {string} - Отформатированная строка или пустая строка в случае ошибки.
 */
export const formatDateTime = (dateInput, currentLocale = 'en') => {
    // 1. Безопасная валидация входных данных
    if (!dateInput) return '';

    try {
        // Превращаем любой входной формат в надежный объект Date
        const date = (dateInput instanceof Date) ? dateInput : parseISO(dateInput);

        // Проверяем, что дата валидна после парсинга
        if (!isValid(date)) {
            console.warn('Invalid date passed to formatDateTime:', dateInput);
            return '';
        }

        // 2. Получаем объект локали из нашего существующего хранилища
        const locale = dateFnsLocales[currentLocale] || enUS;

        // 3. Собираем строку формата
        // 'PP' - это специальный токен в date-fns, который дает локализованную дату (напр., "Jul 28, 2025")
        // 'HH:mm' - это универсальный формат для времени
        const formatString = 'PP, HH:mm';

        // 4. Форматируем и возвращаем результат
        return format(date, formatString, { locale });

    } catch (error) {
        console.error('Error formatting date/time:', error);
        return ''; // Возвращаем пустую строку в случае любой ошибки
    }
};

/**
 * Проверяет, является ли дата сегодняшним днем
 * @param {Date} date - Дата для проверки
 * @returns {boolean}
 */
export const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

/**
 * Проверяет, что две даты являются одним и тем же календарным днем.
 * Безопасно обрабатывает null/undefined.
 * @param {Date | null} dateLeft - Первая дата
 * @param {Date | null} dateRight - Вторая дата
 * @returns {boolean}
 */
export const isSameDate = (dateLeft, dateRight) => {
    if (!dateLeft || !dateRight) return false;
    // Используем isSameDay из date-fns для надежного сравнения
    return isSameDay(dateLeft, dateRight);
};

/**
 * Форматирует дату в строку 'ГГГГ-ММ-ДД' (ISO Date).
 * @param {Date} date - Дата
 * @returns {string} - Отформатированная дата
 */
export const formatToIsoDate = (date) => {
    return format(date, 'yyyy-MM-dd');
};

/**
 * Форматирует дату в строку 'ГГГГ-ММ'.
 * @param {Date} date - Дата
 * @returns {string} - Отформатированный год и месяц
 */
export const formatToYearMonth = (date) => {
    return format(date, 'yyyy-MM');
};

/**
 * Определяет тип смены ('morning', 'day', 'night') на основе времени начала и длительности.
 * Правило для ночной смены: если минимум 2 часа смены попадают в интервал [22:00-06:00], это 'night'.
 * @param {string} startTime - Время начала в формате "HH:MM:SS".
 * @param {number} duration - Длительность смены в часах.
 * @returns {string} - Тип смены: 'morning', 'day' или 'night'.
 */
export const getShiftTypeByTime = (startTime, duration) => {
    if (!startTime || duration === undefined) return 'unknown';

    const [startHour, startMinute] = startTime.split(':').map(Number);

    // Переводим всё в минуты от начала дня для удобства расчетов
    const totalMinutesInDay = 24 * 60;
    const startTotalMinutes = startHour * 60 + startMinute;

    // Ночной интервал: с 22:00 (1320 мин) до 06:00 (360 мин)
    const nightStart = 22 * 60; // 1320
    const nightEnd = 6 * 60;   // 360

    let minutesInNight = 0;
    for (let i = 0; i < duration * 60; i++) {
        const currentMinute = (startTotalMinutes + i) % totalMinutesInDay;

        // Проверяем, попадает ли текущая минута в ночной интервал
        // Интервал пересекает полночь, поэтому условие состоит из двух частей
        if (currentMinute >= nightStart || currentMinute < nightEnd) {
            minutesInNight++;
        }
    }

    // Если в ночном интервале набралось 2 часа (120 минут) или больше
    if (minutesInNight >= 120) {
        return 'night';
    }

    // Если это не ночная смена, определяем по времени начала
    if (startHour >= 5 && startHour < 12) {
        return 'morning';
    }

    // Все остальные дневные/вечерние смены
    return 'day';
};

/**
 * Карта ключевых слов для определения типа смены на разных языках.
 * Все слова должны быть в нижнем регистре.
 */
const SHIFT_TYPE_KEYWORDS_MAP = {
    morning: ['morning', 'утро', 'утренняя', 'בוקר'],
    day: ['day', 'evening', 'afternoon', 'день', 'дневная', 'вечер', 'вечерняя', 'צהריים','יום','ערב'],
    night: ['night', 'ночь', 'ночная', 'לילה']
};
/**
 * Определяет канонический тип смены ('morning', 'day', 'night') по ее названию.
 * Функция универсальна и не зависит от текущего языка интерфейса.
 * @param {string} shiftName - Название смены (e.g., 'משמרת בוקר', 'Night Shift').
 * @returns {string|null} - Канонический тип смены или null, если тип не определен.
 */
export const getCanonicalShiftType = (shiftName) => {
    if (!shiftName) {
        return null;
    }

    const lowerCaseName = shiftName.toLowerCase();

    // Object.entries превращает { morning: [...] } в [['morning', [...]]]
    for (const [type, keywords] of Object.entries(SHIFT_TYPE_KEYWORDS_MAP)) {
        // Проверяем, включает ли название смены хотя бы одно из ключевых слов для данного типа
        if (keywords.some(keyword => lowerCaseName.includes(keyword))) {
            return type; // Возвращаем канонический тип: 'morning', 'day' или 'night'
        }
    }

    return null; // Если ни одно совпадение не найдено
};
/**
 * Возвращает React-компонент иконки для канонического типа смены.
 * @param {string|null} shiftType - Канонический тип ('morning', 'day', 'night') или null.
 * @returns {JSX.Element|null} - Компонент иконки или null.
 */
export const getShiftIcon = (shiftType) => {
    if (!shiftType) {
        return null;
    }

    switch (shiftType) {
        case 'morning':
            return <i className="bi bi-sunrise"></i>;
        case 'day':
            return <i className="bi bi-sun"></i>;
        case 'night':
            return <i className="bi bi-moon-stars"></i>;
        default:
            return null;
    }
};

export const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek; // Sunday = 0
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
};