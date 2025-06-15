export { useI18n as useMessages } from './i18nProvider';
export { useI18n as default } from './i18nProvider';

export const interpolateMessage = (message, variables = {}) => {
    return message.replace(/\{(\w+)}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
};