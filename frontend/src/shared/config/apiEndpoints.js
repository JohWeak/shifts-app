//frontend/src/shared/config/apiEndpoints.js
export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        PROFILE: '/api/auth/profile'
    },

    // Schedules
    SCHEDULES: {
        BASE: '/api/schedules',
        DETAILS: (id) => `/api/schedules/${id}`,
        GENERATE: '/api/schedules/generate',
        STATUS: (id) => `/api/schedules/${id}/status`,
        ASSIGNMENTS: (id) => `/api/schedules/${id}/update-assignments`,
        EXPORT: (id) => `/api/schedules/${id}/export`,
        COMPARE: '/api/schedules/compare-algorithms',
        WEEKLY: '/api/schedules/weekly',
        ADMIN: {
            WEEKLY: '/api/schedules/admin/weekly',
        },
        WEEKLY_BY_POSITION: (positionId) => `/api/schedules/position/${positionId}/weekly`,
        EMPLOYEE_ARCHIVE_SUMMARY: '/api/schedules/employee/archive/summary',
        EMPLOYEE_ARCHIVE_MONTH: '/api/schedules/employee/archive/month',
        VALIDATE: (scheduleId) => `/api/schedules/${scheduleId}/validate`,

    },
    // Employees
    EMPLOYEES: {
        BASE: '/api/employees',
        DETAILS: (id) => `/api/employees/${id}`,
        RECOMMENDATIONS: '/api/employees/recommendations',
        MY_SHIFTS: '/api/employees/my-shifts',
    },

    // Work Sites
    WORKSITES: {
        BASE: '/api/worksites',
        STATS_OVERVIEW: (siteId) => `/api/worksites/${siteId}/statistics`,
    },

    // Constraints
    CONSTRAINTS: {
        BASE: '/api/constraints',
        EMPLOYEE: (empId) => `/api/constraints/employee/${empId}`,
        WEEKLY: '/api/constraints/weekly-grid',
        SUBMIT: '/api/constraints/submit-weekly',
        PERMANENT_REQUESTS_MY: '/api/constraints/permanent-requests/my',
        PERMANENT_REQUEST: '/api/constraints/permanent-request',
        PERMANENT_REQUESTS_ALL: '/api/constraints/permanent-requests',
        PENDING_COUNT: '/api/constraints/permanent-requests/count',
        REVIEW_REQUEST: (id) => `/api/constraints/permanent-request/${id}/review`,
        DELETE_REQUEST: (id) => `/api/constraints/permanent-request/${id}`,
        PERMANENT_CONSTRAINTS_MY: '/api/constraints/permanent-constraints/my',

    },
    SETTINGS: {
        SYSTEM: '/api/settings/system',
        POSITIONS: '/api/positions',
        POSITION_UPDATE: (id) => `/api/positions/${id}`,
        POSITION_SHIFTS: '/api/positions/:id/shifts',
        POSITION_SHIFT: '/api/positions/shifts/:id',
        SHIFT_REQUIREMENTS: '/api/positions/shifts/:id/requirements',
        SHIFT_REQUIREMENT: '/api/positions/requirements/:id',
        POSITION_REQUIREMENTS_MATRIX: '/api/positions/:id/requirements-matrix'
    },
    POSITIONS: {
        BY_SITE: (siteId) => `/api/sites/${siteId}/positions`,
        DETAILS: (positionId) => `/api/positions/${positionId}`,
        SHIFTS: (positionId) => `/api/positions/${positionId}/shifts`,
    },
};