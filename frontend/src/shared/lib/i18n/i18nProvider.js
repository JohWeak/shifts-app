import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from './locales/en';
import { he } from './locales/he';
import { ru } from './locales/ru';

const I18nContext = createContext(undefined);

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
        // If the value is not found, return the key.
        let template = value || key;

        // If the found value is not a string, we simply return it.
        if (typeof template !== 'string') {
            return template;
        }
        if (Array.isArray(replacements)) {
            // For the array, we use positional parameters {0}, {1}, {2}...
            return template.replace(/\{(\d+)\}/g, (match, index) => {
                return replacements[index] !== undefined ? replacements[index] : match;
            });
        } else {
            // For the object, we use named parameters {name}, {count}...
            return template.replace(/\{(\w+)\}/g, (match, placeholder) => {
                return replacements.hasOwnProperty(placeholder) ? replacements[placeholder] : match;
            });
        }
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