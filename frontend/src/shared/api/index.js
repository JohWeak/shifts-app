// frontend/src/shared/api/weeklySchedule.js
import axios from 'axios';


// 1. Создаем один экземпляр axios для всего приложения
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    }
});
console.log('API Base URL is:', api.defaults.baseURL);


// 2. Перехватчик запросов (Request Interceptor)
// Добавляет токен авторизации к каждому запросу
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url, config.params);

        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Перехватчик ответов (Response Interceptor)
// Обрабатывает успешные ответы и глобальные ошибки
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.data);

        // Если это запрос на файл (blob), возвращаем весь ответ как есть
        if (response.config.responseType === 'blob') {
            return response;
        }

        // Список endpoints, которые должны возвращать полный ответ
        const fullResponseEndpoints = [
            '/api/employees',

            // Добавьте другие endpoints, которым нужен полный ответ
        ];

        // Проверяем, нужен ли полный ответ для этого endpoint
        const needsFullResponse = fullResponseEndpoints.some(endpoint =>
            response.config.url.includes(endpoint) && !response.config.url.includes('/recommendations')
        );

        if (needsFullResponse) {
            return response.data;
        }

        // Для остальных используем старую логику
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            return response.data.data;
        }

        return response.data;
    },
    (error) => {
        // ... (обработка ошибок остается без изменений)
        console.error('API Error Interceptor:', error.response || error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default api;