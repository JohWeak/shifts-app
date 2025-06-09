// frontend/src/hooks/useScheduleAPI.js
import { useState } from 'react';
import { API_ENDPOINTS } from '../constants/scheduleConstants';

export const useScheduleAPI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    const handleRequest = async (requestFn) => {
        try {
            setLoading(true);
            setError(null);
            const result = await requestFn();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.SCHEDULES}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch schedules');
            }

            const result = await response.json();
            return result.data;
        });
    };

    const fetchScheduleDetails = async (scheduleId) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.SCHEDULE_DETAILS(scheduleId)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch schedule details');
            }

            const result = await response.json();
            return result.data;
        });
    };

    const generateSchedule = async (settings) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.GENERATE}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    site_id: settings.site_id,
                    algorithm: settings.algorithm,
                    week_start: settings.weekStart
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate schedule');
            }

            const result = await response.json();
            return result.data;
        });
    };

    const compareAlgorithms = async (settings) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.COMPARE}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    site_id: settings.site_id || 1,
                    week_start: settings.week_start || new Date().toISOString().split('T')[0]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to compare algorithms');
            }

            return response.json();
        });
    };

    const deleteSchedule = async (scheduleId) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.DELETE_SCHEDULE(scheduleId)}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete schedule');
            }

            return response.json();
        });
    };

    const updateScheduleAssignments = async (scheduleId, changes) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.UPDATE_ASSIGNMENTS(scheduleId)}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ changes })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update assignments');
            }

            const result = await response.json();
            return result.data;
        });
    };

    const fetchWorkSites = async () => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.WORKSITES}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch work sites');
            }

            return response.json();
        });
    };

    const updateScheduleStatus = async (scheduleId, status) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update schedule status');
            }

            return response.json();
        });
    };

    const exportSchedule = async (scheduleId, format = 'pdf') => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}/export?format=${format}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    // Убираем Content-Type для файловых запросов
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || 'Failed to export schedule');
                } catch {
                    throw new Error('Failed to export schedule');
                }
            }

            // Получаем имя файла из заголовков ответа
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `schedule-${scheduleId}.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // Правильно обрабатываем blob
            const blob = await response.blob();

            // Проверяем, что blob не пустой
            if (blob.size === 0) {
                throw new Error('Received empty file');
            }

            // Создаем URL и скачиваем файл
            const url = window.URL.createObjectURL(new Blob([blob], {
                type: response.headers.get('Content-Type') || 'application/pdf'
            }));

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();

            // Очищаем ресурсы
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            return { success: true, filename };
        });
    };

    return {
        loading,
        error,
        fetchSchedules,
        fetchScheduleDetails,
        generateSchedule,
        compareAlgorithms,
        deleteSchedule,
        updateScheduleAssignments,
        fetchWorkSites,
        updateScheduleStatus,
        exportSchedule
    };
};

export default useScheduleAPI;