import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './locales/en';
import { he } from './locales/he';
import { ru } from './locales/ru';

const I18nContext = createContext();

const translations = { en, he, ru };

export const I18nProvider = ({ children }) => {
    const [locale, setLocale] = useState('en');
    const [direction, setDirection] = useState('ltr');

    useEffect(() => {
        const savedLocale = localStorage.getItem('preferredLocale');
        if (savedLocale && translations[savedLocale]) {
            setLocale(savedLocale);
            setDirection(savedLocale === 'he' ? 'rtl' : 'ltr');
        }
    }, []);

    useEffect(() => {
        document.documentElement.dir = direction;
        document.documentElement.lang = locale;
    }, [direction, locale]);

    const changeLanguage = (newLocale) => {
        setLocale(newLocale);
        setDirection(newLocale === 'he' ? 'rtl' : 'ltr');
        localStorage.setItem('preferredLocale', newLocale);
    };

    const t = (key, replacements = {}) => {
        const keys = key.split('.');
        let value = translations[locale];

        for (const k of keys) {
            value = value?.[k];
        }
        // Если значение не найдено, возвращаем ключ
        let template = value || key;

        // Если найденное значение - не строка, просто возвращаем его
        if (typeof template !== 'string') {
            return template;
        }
        return template.replace(/\{(\w+)\}/g, (match, placeholder) => {
            // Если в объекте replacements есть ключ, совпадающий с плейсхолдером,
            // используем его значение. Иначе - оставляем плейсхолдер как есть.
            return replacements.hasOwnProperty(placeholder) ? replacements[placeholder] : match;
        });
    };

    return (
        <I18nContext.Provider value={{ locale, direction, changeLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};