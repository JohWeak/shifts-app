// backend/src/config/scheduling-constraints.js
/**
 * Constraints configuration
 */


module.exports = {
    // Hard constraints (legal requirements)
    HARD_CONSTRAINTS: {
        MAX_HOURS_PER_DAY: 12,
        MAX_HOURS_PER_WEEK: 48,
        MIN_REST_BETWEEN_SHIFTS: 8,
        MIN_REST_AFTER_NIGHT_SHIFT: 12,
        MIN_REST_AFTER_REGULAR_SHIFT: 8,
        MAX_CONSECUTIVE_DAYS: 6,
        MAX_NIGHT_SHIFTS_PER_WEEK: 7
    },

    // Soft constraints (admin configurable)
    SOFT_CONSTRAINTS: {
        MAX_SHIFTS_PER_DAY: 1,
        MAX_CONSECUTIVE_WORK_DAYS: 6,
        MAX_HOURS_PER_WEEK: 48,
        MAX_CANNOT_WORK_DAYS_PER_WEEK: 3,
        MAX_PREFER_WORK_DAYS_PER_WEEK: 5
    },

    // Optimization weights
    OPTIMIZATION_WEIGHTS: {
        SHORTAGE_PENALTY: 1000,
        PREFER_WORK_BONUS: 10,
        WORKLOAD_BALANCE: 5,
        POSITION_MATCH_BONUS: 20,
        SITE_MATCH_BONUS: 10
    },

    // Solver settings
    SOLVER_SETTINGS: {
        MAX_TIME_SECONDS: 240,
        ENABLE_OVERTIME: false,
        ENABLE_WEEKEND_WORK: true,
        STRICT_REST_REQUIREMENTS: true
    }
};
// module.exports = SCHEDULING_CONSTRAINTS;