// frontend/src/shared/api/scheduleAPI.js
import axios from 'axios';
import { API_ENDPOINTS } from '../config/scheduleConstants'; // Путь к константам изменился

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = (isFormData = false) => {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

// Централизованная обработка ответов
const handleResponse = (response) => {
    // Axios выбрасывает ошибку для статусов вне 2xx диапазона,
    // поэтому мы можем просто вернуть response.data
    return response.data;
};

// Централизованная обработка ошибок
const handleError = (error) => {
    console.error("API Error:", error.response || error);
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    throw new Error(message);
};

export async function fetchSchedules() {
    try {
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULES}`, { headers: getAuthHeaders() });
        return handleResponse(response).data; // API возвращает { success, data }
    } catch (error) {
        handleError(error);
    }
};

export async function fetchScheduleDetails(scheduleId) {
    try {
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.SCHEDULE_DETAILS(scheduleId)}`, { headers: getAuthHeaders() });
        return handleResponse(response).data; // API возвращает { success, data }
    } catch (error) {
        handleError(error);
    }
};

export async function generateSchedule(settings) {
    try {
        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.GENERATE}`, settings, { headers: getAuthHeaders() });
        return handleResponse(response).data;
    } catch (error) {
        handleError(error);
    }
};

export async function compareAlgorithms(settings) {
    try {
        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.COMPARE}`, settings, { headers: getAuthHeaders() });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export async function deleteSchedule(scheduleId)  {
    try {
        const response = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.DELETE_SCHEDULE(scheduleId)}`, { headers: getAuthHeaders() });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export async function updateScheduleAssignments(scheduleId, changes) {
    try {
        const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_ASSIGNMENTS(scheduleId)}`, { changes }, { headers: getAuthHeaders() });
        return handleResponse(response).data;
    } catch (error) {
        handleError(error);
    }
};

export async function updateScheduleStatus(scheduleId, status) {
    try {
        const response = await axios.put(`${API_BASE_URL}/schedules/${scheduleId}/status`, { status }, { headers: getAuthHeaders() });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export async function exportSchedule(scheduleId, format = 'pdf')  {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/schedules/${scheduleId}/export?format=${format}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            responseType: 'blob', // Важно для скачивания файлов
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `schedule-${scheduleId}.${format}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"])(.*?)\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[3]) {
                filename = filenameMatch[3];
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, filename };
    } catch (error) {
        // Ошибка при скачивании файла может быть в виде Blob, нужно её прочитать
        if (error.response && error.response.data instanceof Blob) {
            const errorText = await error.response.data.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || 'Failed to export schedule');
            } catch (e) {
                throw new Error(errorText);
            }
        }
        handleError(error);
    }
};

export async function fetchWorkSites()  {
    try {
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.WORKSITES}`, { headers: getAuthHeaders() });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
}