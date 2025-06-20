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
        COMPARE: '/api/schedules/compare-algorithms'
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
        EMPLOYEE: (empId) => `/api/constraints/employee/${empId}`
    },
    SETTINGS: {
        SYSTEM: '/api/settings/system',
        POSITIONS: '/api/positions',
        POSITION_UPDATE: (id) => `/api/positions/${id}`,
    },
    POSITIONS: {
        BY_SITE: (siteId) => `/api/sites/${siteId}/positions`,
        DETAILS: (positionId) => `/api/positions/${positionId}`
    },
};