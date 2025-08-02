// backend/src/config/scheduling-constraints.js
/**
 * Конфигурация ограничений планирования смен
 */

// const SCHEDULING_CONSTRAINTS = {
//     // ЖЕСТКИЕ ОГРАНИЧЕНИЯ (нельзя нарушать - закон Израиля)
//     HARD_CONSTRAINTS: {
//         MAX_HOURS_PER_DAY: 12,              // Максимум 12 часов в день (закон)
//         MIN_REST_BETWEEN_SHIFTS: 8,        // Минимум 11 часов отдыха между сменами (закон)
//         min_weekly_rest: 24,                // Минимум 24 часа отдыха в неделю (закон)
//         max_night_shifts_per_week: 3,       // Максимум 3 ночные смены в неделю (закон)
//         MAX_HOURS_PER_WEEK: 48,
//         MAX_CONSECUTIVE_DAYS: 6,
//         MAX_NIGHT_SHIFTS_PER_WEEK: 3,
//
//
//         MAX_CONSECUTIVE_WORK_HOURS: 12,  // Максимум часов подряд
//         MIN_REST_AFTER_REGULAR_SHIFT: 8,  // Минимум часов отдыха после обычной смены
//         MIN_REST_AFTER_NIGHT_SHIFT: 12,   // Минимум часов отдыха после ночной смены
//         MAX_SHIFTS_PER_DAY: 1,            // Максимум смен в день
//         MAX_WEEKLY_HOURS: 48,             // Максимум часов в неделю (по закону Израиля)
//         MAX_DAILY_HOURS: 12               // Максимум часов в день
//     },
//
//     // ГИБКИЕ ОГРАНИЧЕНИЯ (можно настраивать в админке)
//     SOFT_CONSTRAINTS: {
//         MAX_SHIFTS_PER_DAY: 1,              // Максимум смен в день (обычно 1)
//         MAX_CONSECUTIVE_WORK_DAYS: 6,       // Максимум дней подряд (можно 7, но не рекомендуется)
//         MAX_HOURS_PER_WEEK: 42,             // Мягкий лимит часов в неделю (можно превысить с доплатой)
//         preferred_hours_per_week: 42,       // Предпочтительный лимит (без доплаты)
//         max_weekend_work_per_month: 3,      // Максимум работы в выходные в месяц
//         //min_employees_per_shift: 1,         // Минимум сотрудников на смену
//         // max_employees_per_shift: 1,         // Максимум сотрудников на смену
//         MAX_CANNOT_WORK_DAYS_PER_WEEK: 3,
//         MAX_PREFER_WORK_DAYS_PER_WEEK: 5,
//
//         PREFERRED_WEEKLY_HOURS: 42,       // Предпочтительное количество часов в неделю
//         MIN_SHIFT_HOURS: 4,               // Минимум часов в смене
//         MAX_CONSECUTIVE_DAYS: 6           // Максимум дней подряд
//     },
//
//     // ПРИОРИТЕТЫ ОПТИМИЗАЦИИ
//     OPTIMIZATION_WEIGHTS: {
//         coverage_weight: 100,               // Вес покрытия всех смен
//         employee_preference_weight: 10,     // Вес предпочтений сотрудников
//         workload_balance_weight: 5,         // Вес балансировки нагрузки
//         overtime_penalty_weight: -2,        // Штраф за сверхурочные
//         weekend_penalty_weight: -1,         // Штраф за работу в выходные
//     },
//
//     // НАСТРОЙКИ РЕШАТЕЛЯ
//     SOLVER_SETTINGS: {
//         max_time_seconds: 60,               // Максимальное время решения
//         enable_overtime: true,              // Разрешить сверхурочные
//         enable_weekend_work: true,          // Разрешить работу в выходные
//         strict_rest_requirements: true,     // Строгие требования к отдыху
//     }
// };
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