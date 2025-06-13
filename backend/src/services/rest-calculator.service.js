// backend/src/services/rest-calculator.service.js
const { ScheduleSettings, Shift } = require('../models');

class RestCalculatorService {
    /**
     * Calculate minimum rest hours between shifts for an employee
     * @param {Object} previousShift - Previous shift object
     * @param {Object} nextShift - Next shift object
     * @param {Object} scheduleSettings - Schedule settings for the work site
     * @returns {number} Minimum rest hours required
     */
    static calculateMinimumRest(previousShift, nextShift, scheduleSettings) {
        if (!previousShift || !scheduleSettings) {
            return scheduleSettings?.min_rest_base_hours || 11;
        }

        let minRest = scheduleSettings.min_rest_base_hours || 11;

        switch (scheduleSettings.rest_calculation_method) {
            case 'fixed':
                return minRest;

            case 'dynamic':
                // Base rest + (shift duration * multiplier)
                const dynamicRest = minRest + (previousShift.duration * scheduleSettings.dynamic_rest_multiplier);
                minRest = Math.max(minRest, dynamicRest);
                break;

            case 'shift_based':
                // Calculate based on shift characteristics
                if (previousShift.is_night_shift) {
                    minRest += scheduleSettings.night_shift_rest_bonus || 3;
                }

                if (previousShift.duration >= scheduleSettings.long_shift_threshold) {
                    minRest += scheduleSettings.long_shift_rest_bonus || 2;
                }
                break;
        }

        return Math.ceil(minRest); // Round up to whole hours
    }

    /**
     * Check if there's sufficient rest between two shifts
     * @param {Date} previousShiftEnd - End time of previous shift
     * @param {Date} nextShiftStart - Start time of next shift
     * @param {number} requiredRestHours - Required rest hours
     * @returns {Object} { isValid: boolean, actualRest: number, requiredRest: number }
     */
    static validateRestPeriod(previousShiftEnd, nextShiftStart, requiredRestHours) {
        const restMilliseconds = nextShiftStart.getTime() - previousShiftEnd.getTime();
        const actualRestHours = restMilliseconds / (1000 * 60 * 60);

        return {
            isValid: actualRestHours >= requiredRestHours,
            actualRest: Math.round(actualRestHours * 10) / 10, // Round to 1 decimal
            requiredRest: requiredRestHours,
            shortfall: Math.max(0, requiredRestHours - actualRestHours)
        };
    }

    /**
     * Get rest priority score for scheduling algorithm
     * @param {Object} validation - Result from validateRestPeriod
     * @returns {number} Priority score (lower is better, 0 is perfect)
     */
    static getRestPriorityScore(validation) {
        if (validation.isValid) {
            // Give bonus points for extra rest
            const extraRest = validation.actualRest - validation.requiredRest;
            return Math.max(0, 10 - extraRest); // 0-10 scale
        } else {
            // Penalty for insufficient rest
            return 100 + (validation.shortfall * 10); // High penalty
        }
    }
}

module.exports = RestCalculatorService;