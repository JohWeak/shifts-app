// frontend/src/shared/api/index.js
import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';
const baseURL = isProduction
    ? ''
    : process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 1. Create a single axios instance for the entire application
const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log('API Base URL is:', api.defaults.baseURL);


// 2. Request Interceptor
//Adds an authorization token to each request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// 3. Response Interceptor
//Handles successful responses and global errors
api.interceptors.response.use(
    (response) => {

        if (response.config.responseType === 'blob') {
            return response;
        }

        // List of endpoints that should return a full response
        const fullResponseEndpoints = [
            '/api/employees',
            '/api/schedules/weekly',
            '/api/schedules/position',
            '/api/schedules/employee',
            '/api/constraints/permanent-requests/my',
            '/api/constraints/permanent-requests',
            '/api/constraints/permanent-request',
        ];

        // Check if a full response is needed for this endpoint
        const requestUrl = response.config.url || '';
        const needsFullResponse = fullResponseEndpoints.some(endpoint =>
            requestUrl.includes(endpoint) && !requestUrl.includes('/recommendations'),
        );


        if (needsFullResponse) {
            return response.data;
        }

        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            return response.data.data;

        }

        return response.data;
    },
    (error) => {
        console.error('API Error Interceptor:', error.response || error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.replace('/login');
        }
        return Promise.reject(error);
    },
);

export default api;