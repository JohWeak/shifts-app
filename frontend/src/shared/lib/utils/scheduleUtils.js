// frontend/src/utils/scheduleUtils.js
import { SCHEDULE_STATUS, BADGE_VARIANTS } from '../../config/scheduleConstants';

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatScheduleDate = (date) => {
    return new Date(date).toLocaleDateString();
};

/**
 * Get badge variant for schedule status
 * @param {string} status - Schedule status
 * @returns {string} - Bootstrap badge variant
 */
export const getStatusBadgeVariant = (status) => {
    return BADGE_VARIANTS[status] || 'secondary';
};

/**
 * Check if schedule can be deleted
 * @param {Object} schedule - Schedule object
 * @returns {boolean} - Whether schedule can be deleted
 */
export const canDeleteSchedule = (schedule) => {
    return schedule.status !== SCHEDULE_STATUS.PUBLISHED;
};

/**
 * Validate if date is a Sunday
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} - Whether date is a Sunday
 */
export const isValidWeekStartDate = (dateString) => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    return selectedDate.getDay() === 0; // 0 = Sunday
};

/**
 * Get next Sunday date
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const getNextSunday = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const daysUntilSunday = (7 - nextWeek.getDay()) % 7;
    nextWeek.setDate(nextWeek.getDate() + daysUntilSunday);

    return nextWeek.toISOString().split('T')[0];
};

/**
 * Calculate week bounds for a given date
 * @param {string|Date} inputDate - Input date
 * @returns {Object} - Week start and end dates
 */
export const calculateWeekBounds = (inputDate = null) => {
    const targetDate = inputDate ? new Date(inputDate) : new Date();
    const dayOfWeek = targetDate.getDay();

    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - dayOfWeek);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0]
    };
};

/**
 * Get site name from schedule object
 * @param {Object} schedule - Schedule object
 * @returns {string} - Site name or 'Unknown'
 */
export const getSiteName = (schedule) => {
    return schedule.workSite?.site_name || schedule.site_name || 'Unknown';
};

/**
 * Count pending changes for a position
 * @param {Object} pendingChanges - All pending changes
 * @param {string} positionId - Position ID
 * @returns {number} - Number of pending changes
 */
export const countPendingChangesForPosition = (pendingChanges, positionId) => {
    return Object.values(pendingChanges).filter(
        change => change.positionId === positionId
    ).length;
};

/**
 * Generate change key for pending changes
 * @param {string} positionId - Position ID
 * @param {string} date - Date string
 * @param {string} shiftId - Shift ID
 * @param {string} action - Action type
 * @param {string} entityId - Employee or Assignment ID
 * @returns {string} - Change key
 */
export const generateChangeKey = (positionId, date, shiftId, action, empId) => {
    const key = `${positionId}-${date}-${shiftId}-${action}-${empId}`;
    console.log('Generated change key:', key);
    return key;
};