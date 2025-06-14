// frontend/src/shared/api/employeeAPI.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const handleError = (error) => {
    console.error("API Error:", error.response || error);
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    throw new Error(message);
};

export async function fetchRecommendations({ positionId, shiftId, date, scheduleId }) {
    try {
        const response = await axios.get(`${API_BASE_URL}/employees/recommendations`, {
            params: {
                position_id: positionId,
                shift_id: shiftId,
                date,
                schedule_id: scheduleId
            },
            headers: getAuthHeaders()
        });
        return response.data.data;
    } catch (error) {
        handleError(error);
    }
}