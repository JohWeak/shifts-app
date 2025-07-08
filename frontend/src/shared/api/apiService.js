// frontend/src/shared/api/apiService.js
import api from './index';
import { API_ENDPOINTS } from '../config/apiEndpoints';

// Группируем функции в объекты-неймспейсы, сохраняя исходные имена.

export const authAPI = {
    loginUser: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    fetchUserProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE)
};

export const scheduleAPI = {
    fetchSchedules: () => api.get(API_ENDPOINTS.SCHEDULES.BASE),
    fetchScheduleDetails: (scheduleId) => api.get(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId)),
    fetchAdminWeeklySchedule: () => api.get(API_ENDPOINTS.SCHEDULES.ADMIN.WEEKLY),
    fetchWeeklySchedule: (weekStart) => {
        console.log('fetchWeeklySchedule called with weekStart:', weekStart);
        return api.get(API_ENDPOINTS.SCHEDULES.WEEKLY, {
            params: weekStart ? { date: weekStart } : {} // Изменено с week_start на date!
        });
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
            // Возвращаем что-то для индикации успеха, если нужно
            return { success: true };
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }
};

export const worksiteAPI = {
    fetchWorkSites: () => api.get(API_ENDPOINTS.WORKSITES.BASE)
};

export const employeeAPI = {

    fetchRecommendations: (scheduleId, positionId, shiftId, date) => {
        console.log('fetchRecommendations called with:', {
            scheduleId,
            positionId,
            shiftId,
            date
        });

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
    submitWeeklyConstraints: (constraints) =>
        api.post(API_ENDPOINTS.CONSTRAINTS.SUBMIT, { constraints }),

    // Get permanent constraint requests
    getPermanentRequests: (empId) =>
        api.get(API_ENDPOINTS.CONSTRAINTS.PERMANENT_REQUESTS(empId)),

    // Submit permanent constraint request
    submitPermanentRequest: (data) =>
        api.post(API_ENDPOINTS.CONSTRAINTS.PERMANENT_REQUEST, data),

    // Admin: get all pending requests
    getPendingRequests: () =>
        api.get(API_ENDPOINTS.CONSTRAINTS.PENDING_REQUESTS),

    // Admin: approve/reject request
    reviewRequest: (requestId, data) =>
        api.put(API_ENDPOINTS.CONSTRAINTS.REVIEW_REQUEST(requestId), data),
};

export const positionAPI = {
    // Принимает siteId и делает GET запрос
    fetchPositions: (siteId) => api.get(API_ENDPOINTS.POSITIONS.BY_SITE(siteId)),
    // Принимает объект должности, извлекает ID для URL, и отправляет весь объект в теле запроса
    updatePosition: (positionData) => api.put(API_ENDPOINTS.POSITIONS.DETAILS(positionData.pos_id), positionData)
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