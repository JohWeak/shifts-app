// frontend/src/shared/lib/utils/scheduleUtils.js
import { format, addDays, startOfWeek, parseISO, isValid } from 'date-fns';

export const getWeekStartDay = (systemSettings) => {
    return systemSettings?.weekStartDay ?? 0; // Default Sunday
};

export const isValidWeekStartDate = (date, weekStartDay = 0) => {
    if (!date) return false;
    const dateObj = date instanceof Date ? date : new Date(date);

    if (!isValid(dateObj)) return false;

    return dateObj.getDay() === weekStartDay;
};

/**
 * Get next week start from today
 * @param {number} weekStartDay - Day of week (0 = Sunday, 1 = Monday)
 * @returns {Date} - Next week start date
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

    // If it's today but we need next occurrence, add 7 days
    if (daysUntilStart === 0) {
        daysUntilStart = 7;
    }

    return addDays(today, daysUntilStart);
};

/**
 * Get the start of week for any given date
 * @param {Date|string} date - Any date
 * @param {number} weekStartDay - Day of week (0 = Sunday, 1 = Monday)
 * @returns {Date} - Start of that week
 */
export const getWeekStartFromDate = (date, weekStartDay = 0) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const currentDay = dateObj.getDay();

    // Calculate how many days to subtract to get to week start
    const daysToSubtract = (currentDay - weekStartDay + 7) % 7;

    return addDays(dateObj, -daysToSubtract);
};

/**
 * Check if a date is a valid week start day and adjust if needed
 * @param {Date|string} date - Input date
 * @param {number} weekStartDay - Expected week start day
 * @returns {Date} - Valid week start date
 */
export const ensureValidWeekStart = (date, weekStartDay = 0) => {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isValidWeekStartDate(dateObj, weekStartDay)) {
        return dateObj;
    }

    return getWeekStartFromDate(dateObj, weekStartDay);
};

export const getWeekDates = (startDate, weekStartDay = 0) => {
    const start = parseISO(startDate);
    const dates = [];

    // Ensure we start with the correct week day
    let currentDate = start;
    if (currentDate.getDay() !== weekStartDay) {
        // Find closest week start day
        const diff = (weekStartDay - currentDate.getDay() + 7) % 7;
        currentDate = addDays(currentDate, diff);
    }

    // Generate 7 days
    for (let i = 0; i < 7; i++) {
        dates.push(addDays(currentDate, i));
    }

    return dates;
};

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

export const getStatusBadgeVariant = (status) => {
    const variants = {
        published: 'success',
        draft: 'warning',
        archived: 'secondary'
    };
    return variants[status] || 'secondary';
};

export const canDeleteSchedule = (schedule) => {
    return schedule.status !== 'published';
};

export const getSiteName = (siteId, sites = []) => {
    const site = sites.find(s => s.site_id === siteId);
    return site?.site_name || `Site ${siteId}`;
};