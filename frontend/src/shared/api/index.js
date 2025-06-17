// frontend/src/shared/api/index.js
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
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Перехватчик ответов (Response Interceptor)
// Обрабатывает успешные ответы и глобальные ошибки
api.interceptors.response.use(
    (response) => {
        // Если это запрос на файл (blob), возвращаем весь ответ как есть
        if (response.config.responseType === 'blob') {
            return response;
        }

        // Проверяем, является ли `response.data` объектом и содержит ли он
        // стандартные поля нашего API (например, `success` или `data`).
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            // Если это наш стандартный "обернутый" ответ,
            // мы извлекаем из него полезные данные.
            return response.data.data;
        }

        // Если это любой другой ответ (например, прямой массив `[]` или объект `{}`),
        // мы возвращаем `response.data` как есть.
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