// frontend/src/constants/scheduleConstants.js

export const API_ENDPOINTS = {
    SCHEDULES: '/schedules',
    GENERATE: '/schedules/generate',
    COMPARE: '/schedules/compare-algorithms',
    WORKSITES: '/worksites',
    UPDATE_ASSIGNMENTS: (id) => `/schedules/${id}/update-assignments`,
    SCHEDULE_DETAILS: (id) => `/schedules/${id}`,
    DELETE_SCHEDULE: (id) => `/schedules/${id}`
};

export const SCHEDULE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

export const ALGORITHM_TYPES = {
    AUTO: 'auto',
    CP_SAT: 'cp-sat',
    SIMPLE: 'simple'
};

export const MODAL_TYPES = {
    GENERATE: 'generate',
    COMPARE: 'compare',
    EMPLOYEE_SELECT: 'employee_select',
    DELETE_CONFIRM: 'delete_confirm'
};

export const BADGE_VARIANTS = {
    [SCHEDULE_STATUS.PUBLISHED]: 'success',
    [SCHEDULE_STATUS.DRAFT]: 'warning',
    [SCHEDULE_STATUS.ARCHIVED]: 'secondary'
};

export const DAYS_OF_WEEK = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
    'THURSDAY', 'FRIDAY', 'SATURDAY'
];

export const DEFAULT_GENERATION_SETTINGS = {
    site_id: 1,
    algorithm: ALGORITHM_TYPES.AUTO,
    weekStart: ''
};