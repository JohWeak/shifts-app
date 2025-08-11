// frontend/src/shared/api/apiService.js
import api from './index';
import { API_ENDPOINTS } from '../config/apiEndpoints';


export const authAPI = {
    loginUser: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    fetchUserProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE)
};

export const scheduleAPI = {
    fetchSchedules: () => api.get(API_ENDPOINTS.SCHEDULES.BASE),
    fetchScheduleDetails: (scheduleId) => api.get(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId)),
    fetchAdminWeeklySchedule: () => api.get(API_ENDPOINTS.SCHEDULES.ADMIN.WEEKLY),
    fetchWeeklySchedule: async (weekStart) => {
        try {
            const response = await api.get(API_ENDPOINTS.SCHEDULES.WEEKLY, {
                params: weekStart ? { date: weekStart } : {}
            });
            return response;
        } catch (error) {
            throw error;
        }
    },
    fetchPositionWeeklySchedule: async (positionId, weekStart) => {
        const response = await api.get(API_ENDPOINTS.SCHEDULES.WEEKLY_BY_POSITION(positionId), {
            params: weekStart ? { date: weekStart } : {}
        });
        return response.data || response;
    },

    generateSchedule: (settings) => api.post(API_ENDPOINTS.SCHEDULES.GENERATE, settings),
    updateScheduleStatus: (scheduleId, status) => api.put(API_ENDPOINTS.SCHEDULES.STATUS(scheduleId), { status }),
    deleteSchedule: (scheduleId) => api.delete(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId)),
    compareAlgorithms: (settings) => api.post(API_ENDPOINTS.SCHEDULES.COMPARE, settings),
    updateScheduleAssignments: (scheduleId, changes) => api.put(API_ENDPOINTS.SCHEDULES.ASSIGNMENTS(scheduleId), { changes }),
    exportSchedule: async (scheduleId, format) => {
        try {
            const response = await api.get(API_ENDPOINTS.SCHEDULES.EXPORT(scheduleId), {
                params: { format },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `schedule_${scheduleId}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    },
    fetchEmployeeArchiveSummary: () => api.get(API_ENDPOINTS.SCHEDULES.EMPLOYEE_ARCHIVE_SUMMARY),

    fetchEmployeeArchiveMonth: (year, month) =>
        api.get(API_ENDPOINTS.SCHEDULES.EMPLOYEE_ARCHIVE_MONTH, {
            params: { year, month }
        }),

};

export const worksiteAPI = {
    fetchWorkSites: () => api.get(API_ENDPOINTS.WORKSITES.BASE),
    fetchWorkSiteStats: (siteId, params) =>
        api.get(API_ENDPOINTS.WORKSITES.STATS_OVERVIEW(siteId), { params }),

};

export const employeeAPI = {

    fetchRecommendations: (scheduleId, positionId, shiftId, date, virtualChanges = null) => {
        console.log('fetchRecommendations called with:', {
            scheduleId,
            positionId,
            shiftId,
            date,
            virtualChanges
        });

        // Если есть virtualChanges, отправляем POST запрос
        if (virtualChanges && virtualChanges.length > 0) {
            console.log('Sending POST request with virtualChanges');
            return api.post(API_ENDPOINTS.EMPLOYEES.RECOMMENDATIONS,
                { virtualChanges },
                {
                    params: {
                        position_id: positionId,
                        shift_id: shiftId,
                        date,
                        schedule_id: scheduleId
                    }
                }
            );
        }

        // Иначе обычный GET запрос
        console.log('Sending GET request without virtualChanges');
        return api.get(API_ENDPOINTS.EMPLOYEES.RECOMMENDATIONS, {
            params: {
                position_id: positionId,
                shift_id: shiftId,
                date,
                schedule_id: scheduleId
            }
        });
    }
};

export const constraintAPI = {
    // Get weekly constraints grid
    getWeeklyConstraints: (params) =>
        api.get(API_ENDPOINTS.CONSTRAINTS.WEEKLY, { params }),

    // Submit weekly constraints
    submitWeeklyConstraints: (data) =>
        api.post(API_ENDPOINTS.CONSTRAINTS.SUBMIT, data),

    // Get my permanent constraint requests (for employee)
    getMyPermanentRequests: () =>
        api.get(API_ENDPOINTS.CONSTRAINTS.PERMANENT_REQUESTS_MY),

    // Submit permanent constraint request
    submitPermanentRequest: (data) =>
        api.post(API_ENDPOINTS.CONSTRAINTS.PERMANENT_REQUEST, data),

    getMyPermanentConstraints: () =>
        api.get(API_ENDPOINTS.CONSTRAINTS.PERMANENT_CONSTRAINTS_MY),

    // Admin: get all permanent requests (with optional status filter)
    getAllPermanentRequests: (params = {}) =>
        api.get(API_ENDPOINTS.CONSTRAINTS.PERMANENT_REQUESTS_ALL, { params }),

    // Admin: get pending requests count
    getPendingRequestsCount: () =>
        api.get(API_ENDPOINTS.CONSTRAINTS.PENDING_COUNT),

    // Admin: approve/reject request
    reviewRequest: (requestId, data) =>
        api.put(API_ENDPOINTS.CONSTRAINTS.REVIEW_REQUEST(requestId), data),

    // Get employee shifts for constraint form
    getEmployeeShifts: () =>
        api.get(API_ENDPOINTS.EMPLOYEES.MY_SHIFTS),

    deletePermanentRequest: (requestId) =>
        api.delete(API_ENDPOINTS.CONSTRAINTS.DELETE_REQUEST(requestId)),

    getPositionShifts: (positionId) =>
        api.get(API_ENDPOINTS.POSITIONS.SHIFTS(positionId)),
};

export const positionAPI = {
    fetchPositions: (siteId) => api.get(API_ENDPOINTS.POSITIONS.BY_SITE(siteId)),
    // Принимает объект должности, извлекает ID для URL, и отправляет весь объект в теле запроса
    updatePosition: (positionData) => api.put(API_ENDPOINTS.POSITIONS.DETAILS(positionData.pos_id), positionData),
    fetchPositionShifts: (positionId) => api.get(API_ENDPOINTS.POSITIONS.SHIFTS(positionId)),
};

export const settingsAPI = {
    fetchSystemSettings: async () => {
        const response = await api.get(API_ENDPOINTS.SETTINGS.SYSTEM);
        return response; // Axios уже возвращает response.data
    },
    updateSystemSettings: async (settings) => {
        const response = await api.put(API_ENDPOINTS.SETTINGS.SYSTEM, settings);
        return response;
    }
};

export const updatePositionShiftColor = async (shiftId, color) => {
    const response = await api.put(`/api/positions/shifts/${shiftId}`, {
        color: color
    });
    return response.data;
};


export const apiService = {
    ...api, //  get, post, put, delete
    auth: authAPI,
    schedule: scheduleAPI,
    worksite: worksiteAPI,
    employee: employeeAPI,
    constraint: constraintAPI,
    position: positionAPI,
    settings: settingsAPI,
    updatePositionShiftColor
};

export default apiService;