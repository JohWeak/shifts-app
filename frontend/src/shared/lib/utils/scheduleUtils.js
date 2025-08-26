// frontend/src/shared/lib/utils/scheduleUtils.js
import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isAfter,
    isSameDay,
    isValid,
    parseISO,
    startOfMonth,
    startOfWeek
} from 'date-fns';
import {enUS, he, ru} from 'date-fns/locale';

const dateFnsLocales = {
    en: enUS,
    he: he,
    ru: ru
};
/**
 * Formats a date into a specified string format, supporting numeric and text values.
 *
 * Placeholders:
 * - Year:   YYYY (2025), YY (25)
 * - Month:  MMMM (August), MMM (Aug), MM (08), M (8)
 * - Day:    DD (05), D (5)
 * - Day of the week:
 *   - dddd: Full name (e.g., Wednesday)
 *   - ddd:  Short name (e.g., Wed)
 *   - dd:   Shortest name (e.g., W)
 *
 * @param {string | Date} dateInput - The input date as a string or Date object.
 * @param {string} format - The format string, e.g., 'dddd, D MMMM YYYY'.
 * @param {string} [locale='en-US'] - The locale for month and day names (e.g., 'ru-RU').
 * @returns {string} - The formatted date string or an empty string on error.
 */
export const formatDate = (dateInput, format = 'DD.MM.YYYY', locale = 'en-US') => {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
        console.error("Invalid date provided:", dateInput);
        return '';
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const replacements = {
        YYYY: year,
        YY: String(year).slice(-2),
        MMMM: new Intl.DateTimeFormat(locale, {month: 'long'}).format(date),
        MMM: new Intl.DateTimeFormat(locale, {month: 'short'}).format(date),
        MM: String(month).padStart(2, '0'),
        M: month,
        DD: String(day).padStart(2, '0'),
        D: day,

        dddd: new Intl.DateTimeFormat(locale, {weekday: 'long'}).format(date),
        ddd: new Intl.DateTimeFormat(locale, {weekday: 'short'}).format(date),
        dd: new Intl.DateTimeFormat(locale, {weekday: 'narrow'}).format(date),
    };


    const regex = /YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|dd|DD|D/g;

    return format.replace(regex, (match) => replacements[match]);
};


/**
 * Calculates the date of the start of the next week based on a given starting day.
 *
 * @param {number} [weekStartDay=0] - The first day of the week (0 for Sunday, 1 for Monday, etc.).
 * Defaults to Sunday if not provided.
 * @returns {Date} The date of the next week's starting day.
 */
export const getNextWeekStart = (weekStartDay = 0) => {
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilStart;
    if (currentDay === weekStartDay) {
        daysUntilStart = 7; // Next week
    } else {
        daysUntilStart = (weekStartDay - currentDay + 7) % 7;
    }

    if (daysUntilStart === 0) {
        daysUntilStart = 7;
    }

    return addDays(today, daysUntilStart);
};

/**
 * Generates an array of date objects for a week starting from a specified date.
 *
 * @param {string} startDate - The start date as a string in ISO format (e.g., "YYYY-MM-DD").
 * @param {number} [weekStartDay=0] - The first day of the week (default is 0 for Sunday).
 *                                     Accepts values from 0 (Sunday) to 6 (Saturday).
 * @returns {Date[]} An array containing 7 date objects, each representing a day
 *                   within the week that starts on the specified weekStartDay.
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
 * Formats the schedule date from a given start date and an optional end date.
 *
 * If the start date is provided, it formats the range as "dd/MM - dd/MM, yyyy".
 * If an end date is not provided, it calculates the end date as 6 days from the start date.
 * If the input is invalid or an error occurs, it returns the original start date.
 *
 * @param {string} startDate - The starting date of the schedule, in ISO format.
 * @param {string|null} [endDate=null] - The optional ending date of the schedule, in ISO format.
 * @returns {string} A formatted date range if valid, or the original startDate if invalid.
 */
export const formatScheduleDate = (startDate, endDate = null) => {
    if (!startDate) return '-';
    let end = endDate;
    try {
        const start = parseISO(startDate);
        if (!endDate) {
            end = addDays(start, 6);
        } else {
            end = parseISO(endDate);
        }

        return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM, yyyy')}`;
    } catch {
        return startDate;
    }
};

/**
 * Formats a shift time range (e.g., "06:00-14:00").
 * Can accept either a duration or an end time.
 * @param {string} startTime - The start time in "HH:MM:SS" format.
 * @param {number | string} endOrDuration - The duration in hours (number) OR the end time in "HH:MM:SS" format (string).
 * @returns {string} - The formatted time string.
 */
export const formatShiftTime = (startTime, endOrDuration) => {
    // Check for basic data
    if (!startTime || !endOrDuration) return '';

    try {
        // Format the start time (always needed)
        const cleanStart = startTime.substring(0, 5);
        let cleanEnd;


        if (typeof endOrDuration === 'string' && endOrDuration.includes(':')) {
            // --- Scenario 1: startTime + endTime provided ---
            cleanEnd = endOrDuration.substring(0, 5);

        } else {
            // --- Scenario 2: startTime + duration provided ---
            const duration = typeof endOrDuration === 'number'
                ? endOrDuration
                : parseFloat(endOrDuration);

            if (isNaN(duration)) {
                console.warn('Invalid duration in formatShiftTime:', endOrDuration);
                return cleanStart;
            }

            // Your original, working logic for calculating the end time
            const [hours, minutes] = startTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + (duration * 60);

            const endHours = Math.floor(endMinutes / 60) % 24;
            const endMins = endMinutes % 60;
            cleanEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        }

        return `${cleanStart}-${cleanEnd}`;

    } catch (error) {
        console.error("Error formatting shift time:", error);
        return startTime;
    }
};

/**
 * Formats the date for a schedule header.
 * @param {Date} date - The date object.
 * @returns {string} - The formatted date.
 */
export const formatTableHeaderDate = (date) => {
    return format(date, 'dd/MM');
};

/**
 * Gets localized names of the days of the week.
 * @param {function} t - The translation function.
 * @param {boolean} short - Whether to use short names.
 * @returns {string[]} - An array of day names.
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
 * Gets the name of a day by its index.
 * @param {number} dayIndex - The day index (0-6).
 * @param {function} t - The translation function.
 * @param {boolean} short - Whether to use the short name.
 * @returns {string} - The name of the day.
 */
export const getDayName = (dayIndex, t, short = false) => {
    const dayNames = getDayNames(t, short);
    return dayNames[dayIndex] || '';
};

/**
 * Determines the badge variant based on the provided status.
 *
 * The function returns a string that represents the badge variant for a given status.
 * The mappings of statuses to badge variants are predefined in the function's internal object.
 * If the provided status does not match any of the predefined statuses, the function returns 'secondary' as the default variant.
 *
 * @param {string} status - The current status for which the badge variant is determined.
 * @returns {string} The corresponding badge variant ('success', 'warning', 'secondary', 'danger') for the given status.
 */
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
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} - The string with the first letter capitalized.
 */
export const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Formats a full date.
 * @param {Date} date - The date object.
 * @param {string} currentLocale - The current language string ('en', 'he', 'ru').
 * @returns {string} - The full date string.
 */
export const formatFullDate = (date, currentLocale = 'en') => {
    const locale = dateFnsLocales[currentLocale] || enUS;
    return capitalizeFirstLetter(format(date, 'EEEE, d MMMM, yyyy', {locale}));
};

/**
 * Formats a week's date range, taking localization into account.
 * @param {object|string} weekOrStartDate - A week object with { start, end } OR a start date string ('YYYY-MM-DD').
 * @param {string} currentLocale - The current language string ('en', 'he', 'ru').
 * @returns {string} - The formatted string.
 */
export const formatWeekRange = (weekOrStartDate, currentLocale = 'en') => {
    let week;

    if (typeof weekOrStartDate === 'string') {
        // If a string is passed, consider it the start date
        // and calculate the end of the week (+6 days)
        try {
            const start = parseISO(weekOrStartDate);
            const end = addDays(start, 6);
            week = {start, end};
        } catch {
            return ''; // Return empty for an invalid date
        }
    } else if (weekOrStartDate && weekOrStartDate.start && weekOrStartDate.end) {
        // If it's an object, use it as is
        week = weekOrStartDate;
    } else {
        // If the input is invalid
        return '';
    }

    const locale = dateFnsLocales[currentLocale] || enUS;

    try {
        // Now we can be sure that week.start and week.end exist
        const start = (week.start instanceof Date) ? week.start : parseISO(week.start);
        const end = (week.end instanceof Date) ? week.end : parseISO(week.end);

        if (!isValid(start) || !isValid(end)) return '';

        // Formatting logic remains the same
        if (start.getFullYear() === end.getFullYear()) {
            const startFormatted = capitalizeFirstLetter(format(start, 'd MMMM', {locale}));
            const endFormatted = format(end, 'd MMMM, yyyy', {locale});
            return `${startFormatted} - ${endFormatted}`;
        } else {
            const startFormatted = format(start, 'd MMMM, yyyy', {locale});
            const endFormatted = format(end, 'd MMMM, yyyy', {locale});
            return `${startFormatted} - ${endFormatted}`;
        }
    } catch {
        // Safe fallback
        const startStr = (week.start instanceof Date) ? format(week.start, 'yyyy-MM-dd') : week.start;
        const endStr = (week.end instanceof Date) ? format(week.end, 'yyyy-MM-dd') : week.end;
        return `${startStr} - ${endStr}`;
    }
};

/**
 * Determines whether a schedule can be deleted based on its status.
 *
 * The function evaluates the given schedule object and returns a boolean indicating
 * whether the schedule is eligible for deletion. A schedule can be deleted if:
 * - It exists (is not null or undefined).
 * - Its status matches 'draft' or 'unpublished' (case-insensitive).
 *
 * @param {Object} schedule - The schedule object to evaluate.
 * @param {string} schedule.status - The current status of the schedule.
 * @returns {boolean} True if the schedule can be deleted; otherwise, false.
 */
export const canDeleteSchedule = (schedule) => {
    if (!schedule) return false;
    return ['draft', 'unpublished'].includes(schedule.status?.toLowerCase());
};

/**
 * Determines whether a schedule can be published.
 *
 * The function accepts a schedule object and checks if the schedule
 * is eligible for publication. A schedule can be published only if it
 * exists and its status is marked as 'draft'.
 *
 * @param {Object} schedule - The schedule object to evaluate.
 * @returns {boolean} Returns true if the schedule is eligible for publication, otherwise false.
 */
export const canPublishSchedule = (schedule) => {
    if (!schedule) return false;
    return schedule.status === 'draft';
};

/**
 * Determines whether a schedule can be unpublished.
 *
 * This function checks the provided schedule object to determine
 * if its status allows it to be unpublished. A schedule can only
 * be unpublished if it exists and its status is set to 'published'.
 *
 * @param {Object} schedule - The schedule object to be checked.
 * @param {string} schedule.status - The current status of the schedule.
 * @returns {boolean} Returns true if the schedule can be unpublished, otherwise false.
 */
export const canUnpublishSchedule = (schedule) => {
    if (!schedule) return false;
    return schedule.status === 'published';
};

/**
 * Determines whether the current schedule can be edited.
 *
 * @function
 * @name canEditSchedule
 * @param {Object} schedule - The schedule object to evaluate.
 * @param {string} schedule.status - The status of the schedule. Typically checked for 'draft' status to determine editability.
 * @returns {boolean} Returns true if the schedule can be edited (i.e., if its status is 'draft'); otherwise, false.
 */
export const canEditSchedule = (schedule) => {
    if (!schedule) return false;
    return schedule.status === 'draft';
};
/**
 * Formats an employee's name with various options.
 * @param {object | string} employeeOrFirstName - The employee object or first name.
 * @param {object | string} [optionsOrLastName] - An options object or the last name.
 * @param {boolean} [legacyShowFullName] - (For compatibility) A flag for showing the full name.
 * @returns {string} - The formatted name.
 */
export const formatEmployeeName = (employeeOrFirstName, optionsOrLastName = {}, legacyShowFullName = false) => {
    if (typeof employeeOrFirstName === 'string') {
        // --- BACKWARDS COMPATIBILITY MODE ---
        const firstName = employeeOrFirstName;
        const lastName = typeof optionsOrLastName === 'string' ? optionsOrLastName : '';
        const showFullName = legacyShowFullName;

        if (!firstName && !lastName) return '-';
        if (showFullName) {
            return `${firstName || ''} ${lastName || ''}`.trim();
        }
        return firstName || lastName || '-';
    }

    // --- NEW OBJECT-BASED MODE ---
    const employee = employeeOrFirstName;
    const {
        showFullName = false,
        checkDuplicates = false,
        contextEmployees = []
    } = optionsOrLastName;

    if (!employee) return '-';

    // Extract names from various possible fields
    const fullName = employee.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const firstName = employee.first_name || fullName.split(' ')[0] || '';
    const lastName = employee.last_name || fullName.split(' ').slice(1).join(' ') || '';

    if (!firstName && !lastName) return '-';

    // If full name is needed, return it
    if (showFullName) {
        return fullName;
    }

    // --- DUPLICATE CHECKING LOGIC ---
    // This will only trigger if the required options are passed
    if (checkDuplicates && contextEmployees.length > 0) {
        const duplicateNames = contextEmployees.filter(emp =>
            (emp.first_name || emp.employee_name?.split(' ')[0]) === firstName
        );

        if (duplicateNames.length > 1) {
            return `${firstName} ${lastName.charAt(0) || ''}.`.trim();
        }
    }

    // By default, return only the first name
    return firstName;
};

/**
 * Formats minutes into HH:MM format.
 * @param {number} minutes - The number of minutes.
 * @returns {string} - The formatted time.
 */
export const formatMinutesToHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Checks if a date has a shift.
 * @param {Date} date - The date to check.
 * @param {Array} shifts - An array of shifts.
 * @returns {Object|null} - The shift object or null.
 */
export const getShiftForDate = (date, shifts) => {
    if (!shifts || !Array.isArray(shifts)) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find(shift => shift.work_date === dateStr) || null;
};

/**
 * Formats the month and year.
 * @param {Date} date - Date object.
 * @param {string} currentLocale - Current locale code ('en', 'he', 'ru').
 * @returns {string} - Formatted month and year.
 */
export const formatMonthYear = (date, currentLocale) => {
    const locale = dateFnsLocales[currentLocale] || enUS;
    return format(date, 'MMMM yyyy', {locale});
};

/**
 * Gets all days of a month.
 * @param {Date} date - Any date within the month.
 * @returns {Array<Date>} - An array of dates for the month.
 */
export const getMonthDays = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({start, end});
};

/**
 * Formats the day number.
 * @param {Date} date - The date object.
 * @returns {string} - The day number.
 */
export const formatDayNumber = (date) => {
    return format(date, 'd');
};

/**
 * Formats a date and time with localization.
 * Returns a string like "Month Day, Year, HH:MM".
 * @param {Date | string | number} dateInput - The input date (Date object, ISO string, or timestamp).
 * @param {string} currentLocale - The current language string ('en', 'he', 'ru').
 * @returns {string} - The formatted string or an empty string on error.
 */
export const formatDateTime = (dateInput, currentLocale = 'en') => {
    // 1. Safely validate the input
    if (!dateInput) return '';

    try {
        // Convert any input format to a reliable Date object
        const date = (dateInput instanceof Date) ? dateInput : parseISO(dateInput);

        // Check if the date is valid after parsing
        if (!isValid(date)) {
            console.warn('Invalid date passed to formatDateTime:', dateInput);
            return '';
        }

        // 2. Get the locale object from our existing store
        const locale = dateFnsLocales[currentLocale] || enUS;

        // 3. Assemble the format string
        // 'PP' is a special token in date-fns that gives a localized date (e.g., "Jul 28, 2025")
        // 'HH:mm' is a universal format for time
        const formatString = 'PP, HH:mm';

        // 4. Format and return the result
        return format(date, formatString, {locale});

    } catch (error) {
        console.error('Error formatting date/time:', error);
        return ''; // Return an empty string in case of any error
    }
};

/**
 * Checks if a date is today.
 * @param {Date} date - The date to check.
 * @returns {boolean}
 */
export const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

/**
 * Checks if two dates are the same calendar day.
 * Safely handles null/undefined values.
 * @param {Date | null} dateLeft - The first date.
 * @param {Date | null} dateRight - The second date.
 * @returns {boolean}
 */
export const isSameDate = (dateLeft, dateRight) => {
    if (!dateLeft || !dateRight) return false;

    return isSameDay(dateLeft, dateRight);
};

/**
 * Formats a date into a 'YYYY-MM-DD' string (ISO Date).
 * @param {Date} date - The date object.
 * @returns {string} - The formatted date.
 */
export const formatToIsoDate = (date) => {
    return format(date, 'yyyy-MM-dd');
};

/**
 * Formats a date into a 'YYYY-MM' string.
 * @param {Date} date - The date object.
 * @returns {string} - The formatted year and month.
 */
export const formatToYearMonth = (date) => {
    return format(date, 'yyyy-MM');
};


/**
 * Map of keywords to determine the shift type in different languages.
 * All words must be in lowercase.
 */
const SHIFT_TYPE_KEYWORDS_MAP = {
    morning: ['morning', 'утро', 'утренняя', 'בוקר'],
    day: ['day', 'evening', 'afternoon', 'день', 'дневная', 'вечер', 'вечерняя', 'צהריים', 'יום', 'ערב'],
    night: ['night', 'ночь', 'ночная', 'לילה']
};
/**
 * Determines the canonical shift type ('morning', 'day', 'night') by its name.
 * The function is universal and does not depend on the current interface language.
 * @param {string} shiftName - The name of the shift (e.g., 'משמרת בוקר', 'Night Shift').
 * @returns {string|null} - The canonical shift type or null if the type cannot be determined.
 */
export const getCanonicalShiftType = (shiftName) => {
    if (!shiftName) {
        return null;
    }

    const lowerCaseName = shiftName.toLowerCase();

    // Object.entries turns { morning: [...] } into [['morning', [...]]]
    for (const [type, keywords] of Object.entries(SHIFT_TYPE_KEYWORDS_MAP)) {
        // Check if the shift name includes at least one of the keywords for this type
        if (keywords.some(keyword => lowerCaseName.includes(keyword))) {
            return type; // Return the canonical type: 'morning', 'day', or 'night'
        }
    }

    return null;
};
/**
 * Returns a React icon component for a canonical shift type.
 * @param {string|null} shiftType - The canonical type ('morning', 'day', 'night') or null.
 * @returns {JSX.Element|null} - The icon component or null.
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


/**
 * Classifies a list of schedules into active, inactive, and schedules overlapping with the current week.
 *
 * @param {Array<Object>} schedules - An array of schedule objects to be classified.
 * @param {string} schedules[].id - The unique identifier of the schedule.
 * @param {string} schedules[].start_date - The start date of the schedule in ISO 8601 format.
 * @param {string} schedules[].end_date - The end date of the schedule in ISO 8601 format.
 *
 * @returns {Object} An object containing the classified schedules and overlapping schedule IDs.
 * @returns {Array<Object>} return.activeSchedules - An array of schedules still active as of the current day.
 * @returns {Array<Object>} return.inactiveSchedules - An array of schedules that have ended before the current day.
 * @returns {Set<string>} return.currentWeekScheduleIds - A set of IDs for schedules that overlap with the current week.
 */
export const classifySchedules = (schedules) => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, {weekStartsOn: 0});
    const currentWeekEnd = endOfWeek(today, {weekStartsOn: 0});

    const active = [];
    const inactive = [];
    const currentIds = new Set();

    schedules.forEach(schedule => {
        if (!schedule.end_date) return;

        const startDate = parseISO(schedule.start_date);
        const endDate = parseISO(schedule.end_date);

        // Check if schedule overlaps with current week
        if (startDate <= currentWeekEnd && endDate >= currentWeekStart) {
            currentIds.add(schedule.id);
        }

        // Check if schedule is active (ends after today)
        if (isAfter(endDate, today) || isSameDay(endDate, today)) {
            active.push(schedule);
        } else {
            inactive.push(schedule);
        }
    });

    return {
        activeSchedules: active,
        inactiveSchedules: inactive,
        currentWeekScheduleIds: currentIds
    };
};


