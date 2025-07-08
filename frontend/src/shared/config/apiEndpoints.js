import api from "../api";

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
        }
    },
    // Employees
    EMPLOYEES: {
        BASE: '/api/employees',
        DETAILS: (id) => `/api/employees/${id}`,
        RECOMMENDATIONS: '/api/employees/recommendations'
    },

    // Work Sites
    WORKSITES: {
        BASE: '/api/worksites'
    },

    // Constraints
    CONSTRAINTS: {
        BASE: '/api/constraints',
        EMPLOYEE: (empId) => `/api/constraints/employee/${empId}`,
        WEEKLY: '/api/constraints/weekly',
        SUBMIT: '/api/constraints/submit',
        PERMANENT_REQUESTS: (empId) => `/api/constraints/permanent-requests/${empId}`,
        PERMANENT_REQUEST: '/api/constraints/permanent-request',
        PENDING_REQUESTS: '/api/constraints/pending-requests',
        REVIEW_REQUEST: (id) => `/api/constraints/review-request/${id}`,
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
        DETAILS: (positionId) => `/api/positions/${positionId}`
    },
};