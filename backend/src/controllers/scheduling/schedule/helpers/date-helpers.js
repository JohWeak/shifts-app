// backend/src/controllers/schedule/helpers/date-helpers.js
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const ISRAEL_TIMEZONE = 'Asia/Jerusalem';
const DATE_FORMAT = 'YYYY-MM-DD';
const WEEK_START_DAY = 0; // Sunday

// Set locale to start week on Sunday
dayjs.locale({
    ...dayjs.Ls.en,
    weekStart: WEEK_START_DAY
});

/**
 * Calculate week boundaries in Israel timezone
 * @param {string|Date} inputDate - Target date
 * @returns {Object} - { weekStart, weekEnd, weekStartStr, weekEndStr }
 */
function calculateWeekBounds(inputDate = null) {
    try {
        // Parse input date in Israel timezone
        let targetDate;
        if (inputDate) {
            targetDate = dayjs(inputDate).tz(ISRAEL_TIMEZONE);
        } else {
            targetDate = dayjs().tz(ISRAEL_TIMEZONE);
        }

        // Use native JavaScript Date for accurate day calculation
        const jsDate = new Date(targetDate.format('YYYY-MM-DD'));
        const dayOfWeek = jsDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

        // Calculate days to subtract to get to Sunday
        const daysToSubtract = dayOfWeek;

        // Calculate week start (Sunday)
        const weekStartJs = new Date(jsDate);
        weekStartJs.setDate(jsDate.getDate() - daysToSubtract);

        // Calculate week end (Saturday)
        const weekEndJs = new Date(weekStartJs);
        weekEndJs.setDate(weekStartJs.getDate() + 6);

        // Convert back to dayjs for formatting
        const weekStart = dayjs(weekStartJs).tz(ISRAEL_TIMEZONE);
        const weekEnd = dayjs(weekEndJs).tz(ISRAEL_TIMEZONE);

        // Convert to UTC for database storage
        const weekStartUtc = weekStart.utc();
        const weekEndUtc = weekEnd.utc();

        // Format as strings for database queries
        const weekStartStr = weekStartUtc.format(DATE_FORMAT);
        const weekEndStr = weekEndUtc.format(DATE_FORMAT);

        // Debug logging with verification
        console.log(`[Week Calculation] Input: ${inputDate || 'now'}`);
        console.log(`[Week Calculation] Israel time: ${targetDate.format('YYYY-MM-DD dddd')}`);
        console.log(`[Week Calculation] Week: ${weekStartStr} (${weekStart.format('dddd')}) to ${weekEndStr} (${weekEnd.format('dddd')})`);

        // Validate that we got Sunday to Saturday
        if (weekStartJs.getDay() !== 0) {
            console.error(`[Week Calculation] ERROR: Week start is day ${weekStartJs.getDay()}, should be 0 (Sunday)!`);
        }
        if (weekEndJs.getDay() !== 6) {
            console.error(`[Week Calculation] ERROR: Week end is day ${weekEndJs.getDay()}, should be 6 (Saturday)!`);
        }

        return {
            weekStart: weekStartUtc.toDate(),
            weekEnd: weekEndUtc.toDate(),
            weekStartStr,
            weekEndStr,
            israelWeekStart: weekStart,
            israelWeekEnd: weekEnd
        };
    } catch (error) {
        console.error('[Week Calculation] Error:', error);
        throw new Error('Invalid date format');
    }
}

/**
 * Get day name in Hebrew
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Hebrew day name
 */
function getHebrewDayName(dateStr) {
    const date = dayjs(dateStr).tz(ISRAEL_TIMEZONE);
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return dayNames[date.day()];
}

/**
 * Format date for display
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date (DD/MM)
 */
function formatDisplayDate(dateStr) {
    return dayjs(dateStr).tz(ISRAEL_TIMEZONE).format('DD/MM');
}

/**
 * Format comparison result for response
 */
function formatComparisonResult(result, algorithmName) {
    if (result.status === 'fulfilled' && result.value?.success) {
        return {
            status: 'success',
            assignments_count: result.value.stats?.total_assignments || 0,
            employees_count: result.value.stats?.employees_assigned || 0,
            execution_time: result.value.solve_time || result.value.iterations || 'N/A',
            stats: result.value.stats || {}
        };
    } else {
        return {
            status: 'failed',
            assignments_count: 0,
            employees_count: 0,
            execution_time: 'N/A',
            error: result.status === 'rejected' ?
                result.reason.message :
                result.value?.error || 'Unknown error'
        };
    }
}

module.exports = {
    calculateWeekBounds,
    getHebrewDayName,
    formatDisplayDate,
    formatComparisonResult,
    ISRAEL_TIMEZONE,
    DATE_FORMAT,
    WEEK_START_DAY
};