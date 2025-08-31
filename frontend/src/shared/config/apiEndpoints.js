//frontend/src/shared/config/apiEndpoints.js
const API_BASE = '/api';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_BASE}/auth/login`,
        LOGOUT: `${API_BASE}/auth/logout`,
    },

    WORKSITES: {
        BASE: `${API_BASE}/worksites`,
        DETAILS: (worksiteId) => `${API_BASE}/worksites/${worksiteId}`,
        RESTORE: (worksiteId) => `${API_BASE}/worksites/${worksiteId}/restore`,
        STATS_OVERVIEW: (worksiteId) => `${API_BASE}/worksites/${worksiteId}/statistics`,
        POSITIONS: (worksiteId) => `${API_BASE}/worksites/${worksiteId}/positions`,
    },

    POSITIONS: {
        BASE: `${API_BASE}/positions`,
        DETAILS: (positionId) => `${API_BASE}/positions/${positionId}`,
        RESTORE: (positionId) => `${API_BASE}/positions/${positionId}/restore`,
        // matrix route for a position
        REQUIREMENTS_MATRIX: (positionId) => `${API_BASE}/positions/${positionId}/requirements-matrix`,
    },

    SHIFTS: {
        // A shift belongs to a position
        BY_POSITION: (positionId) => `${API_BASE}/positions/${positionId}/shifts`,
        DETAILS: (shiftId) => `${API_BASE}/shifts/${shiftId}`,
    },

    REQUIREMENTS: {
        // A requirement belongs to a shift
        BY_SHIFT: (shiftId) => `${API_BASE}/shifts/${shiftId}/requirements`,
        DETAILS: (requirementId) => `${API_BASE}/requirements/${requirementId}`,
    },

    SCHEDULES: {
        BASE: `${API_BASE}/schedules`,
        DETAILS: (scheduleId) => `${API_BASE}/schedules/${scheduleId}`,
        GENERATE: `${API_BASE}/schedules/generate`,
        COMPARE_ALGORITHMS: `${API_BASE}/schedules/compare-algorithms`,
        STATUS: (scheduleId) => `${API_BASE}/schedules/${scheduleId}/status`,
        ASSIGNMENTS: (scheduleId) => `${API_BASE}/schedules/${scheduleId}/update-assignments`,
        EXPORT: (scheduleId) => `${API_BASE}/schedules/${scheduleId}/export`,
        VALIDATE: (scheduleId) => `${API_BASE}/schedules/${scheduleId}/validate`,
        // Employee-facing weekly schedules
        WEEKLY: `${API_BASE}/schedules/weekly`,
        WEEKLY_BY_POSITION: (positionId) => `${API_BASE}/schedules/position/${positionId}/weekly`,
        // Archive
        EMPLOYEE_ARCHIVE_SUMMARY: `${API_BASE}/schedules/employee/archive/summary`,
        EMPLOYEE_ARCHIVE_MONTH: `${API_BASE}/schedules/employee/archive/month`,
    },

    EMPLOYEES: {
        BASE: `${API_BASE}/employees`,
        DETAILS: (employeeId) => `${API_BASE}/employees/${employeeId}`,
        RECOMMENDATIONS: `${API_BASE}/employees/recommendations`,
        MY_SHIFTS: `${API_BASE}/employees/my-shifts`,
        PROFILE: `${API_BASE}/employees/profile`,
    },

    CONSTRAINTS: {
        // Employee-facing
        WEEKLY_GRID: `${API_BASE}/constraints/weekly-grid`,
        SUBMIT_WEEKLY: `${API_BASE}/constraints/submit-weekly`,
        MY_PERMANENT_REQUESTS: `${API_BASE}/constraints/permanent-requests/my`,
        SUBMIT_PERMANENT_REQUEST: `${API_BASE}/constraints/permanent-request`,
        DELETE_PERMANENT_REQUEST: (requestId) => `${API_BASE}/constraints/permanent-request/${requestId}`,
        MY_PERMANENT_CONSTRAINTS: `${API_BASE}/constraints/permanent-constraints/my`,
        // Admin-facing
        ALL_PERMANENT_REQUESTS: `${API_BASE}/constraints/permanent-requests`,
        PENDING_COUNT: `${API_BASE}/constraints/permanent-requests/count`,
        REVIEW_REQUEST: (requestId) => `${API_BASE}/constraints/permanent-request/${requestId}/review`,
    },

    SETTINGS: {
        SYSTEM: `${API_BASE}/settings/system`,
        SCHEDULE_SETTINGS_ALL_SITES: `${API_BASE}/settings/schedule/sites`,
        SCHEDULE_SETTINGS_BY_SITE: (siteId) => `${API_BASE}/settings/schedule/site/${siteId}`,
    },
};