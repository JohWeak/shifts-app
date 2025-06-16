// frontend/src/shared/api/scheduleAPI.js
import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiEndpoints';

// Create axios instance with default config
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
api.interceptors.response.use(
    (response) => {
        // Для ответов с пагинацией сохраняем структуру
        if (response.data && 'success' in response.data && 'data' in response.data) {
            // Если есть pagination, сохраняем её
            if (response.data.pagination) {
                response.data = {
                    items: response.data.data,
                    pagination: response.data.pagination,
                    success: response.data.success
                };
            } else {
                // Для простых ответов просто извлекаем data
                response.data = response.data.data;
            }
        }
        return response;
    },
    (error) => Promise.reject(error)
);

// Handle errors
const handleError = (error) => {
    console.error('API Error:', error.response || error);
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    throw error;
};

// Schedule API functions
export const fetchSchedules = async () => {
    try {
        const response = await api.get(API_ENDPOINTS.SCHEDULES.BASE);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const fetchScheduleDetails = async (scheduleId) => {
    try {
        const response = await api.get(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId));
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const generateSchedule = async (settings) => {
    try {
        const response = await api.post(API_ENDPOINTS.SCHEDULES.GENERATE, settings);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const updateScheduleStatus = async (scheduleId, status) => {
    try {
        const response = await api.patch(API_ENDPOINTS.SCHEDULES.STATUS(scheduleId), { status });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const deleteSchedule = async (scheduleId) => {
    try {
        const response = await api.delete(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId));
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const compareAlgorithms = async (settings) => {
    try {
        const response = await api.post(API_ENDPOINTS.SCHEDULES.COMPARE, settings);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const updateScheduleAssignments = async (scheduleId, changes) => {
    try {
        const response = await api.put(API_ENDPOINTS.SCHEDULES.ASSIGNMENTS(scheduleId), { changes });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const exportSchedule = async (scheduleId, format) => {
    try {
        const response = await api.get(API_ENDPOINTS.SCHEDULES.EXPORT(scheduleId), {
            params: { format },
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `schedule_${scheduleId}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Work sites
export const fetchWorkSites = async () => {
    try {
        const response = await api.get(API_ENDPOINTS.WORKSITES.BASE);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Employee recommendations
export const getRecommendations = async (scheduleId, positionId, shiftId, date) => {
    try {
        const response = await api.get(API_ENDPOINTS.EMPLOYEES.RECOMMENDATIONS, {
            params: { scheduleId, positionId, shiftId, date }
        });
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Additional schedule-related functions that might be needed
export const fetchSchedulePositions = async (scheduleId) => {
    try {
        const response = await api.get(`/api/schedules/${scheduleId}/positions`);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const fetchScheduleEmployees = async (scheduleId) => {
    try {
        const response = await api.get(`/api/schedules/${scheduleId}/employees`);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const fetchScheduleShifts = async (scheduleId) => {
    try {
        const response = await api.get(`/api/schedules/${scheduleId}/shifts`);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Schedule settings
export const fetchScheduleSettings = async (siteId) => {
    try {
        const response = await api.get(`/api/schedule-settings/${siteId}`);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const updateScheduleSettings = async (siteId, settings) => {
    try {
        const response = await api.put(`/api/schedule-settings/${siteId}`, settings);
        return response;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Export the axios instance for custom requests
export default api;