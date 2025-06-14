// frontend/src/shared/api/worksiteAPI.js
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

export async function fetchWorkSites() {
    try {
        const response = await axios.get(`${API_BASE_URL}/worksites`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handleError(error);
    }
}