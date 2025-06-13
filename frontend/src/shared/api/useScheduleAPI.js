// frontend/src/hooks/useScheduleAPI.js
import { useState } from 'react';
import { API_ENDPOINTS } from '../config/scheduleConstants';

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
            console.log('Fetching schedule details for ID:', scheduleId);

            const response = await fetch(`http://localhost:5000${API_ENDPOINTS.SCHEDULE_DETAILS(scheduleId)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch schedule details');
            }

            const result = await response.json();
            console.log('Raw API response:', result);
            console.log('Returning data:', result.data);

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

    // NEW: Function to remove employee from shift
    const removeEmployeeFromShift = async ({ date, positionId, shiftId, empId }) => {
        return handleRequest(async () => {
            const response = await fetch(`http://localhost:5000/api/schedule/remove-employee`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    date,
                    positionId,
                    shiftId,
                    empId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove employee from shift');
            }

            const result = await response.json();
            return result.data;
        });
    };

    // NEW: Function to fetch available employees for a shift
    const fetchAvailableEmployees = async (date, positionId, shiftId) => {
        return handleRequest(async () => {
            const response = await fetch(
                `http://localhost:5000/api/employees/available?date=${date}&positionId=${positionId}&shiftId=${shiftId}`,
                {
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch available employees');
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
                    // No Content-Type header for file downloads
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

            // Get filename from response headers
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `schedule-${scheduleId}.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"])(.*?)\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[3]) {
                    filename = filenameMatch[3];
                }
            }

            // Convert response to blob
            const blob = await response.blob();

            // Create download link and trigger download
            const url = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;

            // Append to body, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up the URL object
            window.URL.revokeObjectURL(url);

            return {
                success: true,
                filename: filename,
                message: 'Schedule exported successfully'
            };
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
        removeEmployeeFromShift,
        fetchAvailableEmployees,
        fetchWorkSites,
        updateScheduleStatus,
        exportSchedule
    };
};

export default useScheduleAPI;