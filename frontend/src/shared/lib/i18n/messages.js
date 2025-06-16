export { useI18n as useMessages } from './i18nProvider';
export { useI18n as default } from './i18nProvider';

// Исправить функцию interpolateMessage
export const interpolateMessage = (message, variables = {}) => {
    // Проверка на undefined/null
    if (!message || typeof message !== 'string') {
        console.warn('interpolateMessage: message is not a string', message);
        return message || '';
    }

    return message.replace(/\{(\w+)}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
};