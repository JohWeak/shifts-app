// backend/src/services/rest-calculator.service.js
const constraints = require('../config/scheduling-constraints');
const dayjs = require('dayjs');

class RestCalculatorService {
    constructor(db) {
        this.db = db;
    }

    checkRestViolation(currentAssignment, nextAssignment, currentShift, nextShift) {
        if (!currentShift || !nextShift) return null;

        // Calculate end time of current shift
        const currentDate = dayjs(currentAssignment.work_date);
        let currentEnd = currentDate.set('hour', parseInt(currentShift.end_time.split(':')[0]))
            .set('minute', parseInt(currentShift.end_time.split(':')[1]));

        // Handle overnight shifts
        if (currentShift.end_time < currentShift.start_time) {
            currentEnd = currentEnd.add(1, 'day');
        }

        // Calculate start time of next shift
        const nextDate = dayjs(nextAssignment.work_date);
        const nextStart = nextDate.set('hour', parseInt(nextShift.start_time.split(':')[0]))
            .set('minute', parseInt(nextShift.start_time.split(':')[1]));

        // Calculate rest hours
        const restHours = nextStart.diff(currentEnd, 'hours', true);

        // Determine required rest based on shift type
        const isNightShift = currentShift.is_night_shift ||
            currentShift.shift_name.toLowerCase().includes('night') ||
            currentShift.shift_name.toLowerCase().includes('לילה');

        const requiredRest = isNightShift
            ? constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_NIGHT_SHIFT
            : constraints.HARD_CONSTRAINTS.MIN_REST_AFTER_REGULAR_SHIFT;

        if (restHours < requiredRest) {
            return {
                currentShift: currentShift.shift_name,
                nextShift: nextShift.shift_name,
                currentDate: currentAssignment.work_date,
                nextDate: nextAssignment.work_date,
                restHours: Math.floor(restHours),
                requiredRest
            };
        }

        return null;
    }
}

module.exports = RestCalculatorService;