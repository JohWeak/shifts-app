import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './LanguageSwitch.css';

export const LanguageSwitch = () => {
    const { locale, changeLanguage, direction } = useI18n();

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'he', name: 'עברית', flag: '🇮🇱' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' }
    ];

    const currentLang = languages.find(lang => lang.code === locale);

    return (
        <Dropdown className="language-switch" align={direction === 'rtl' ? 'start' : 'end'}>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
                <span>{currentLang?.code.toString().toLocaleUpperCase()}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {languages.map(lang => (
                    <Dropdown.Item
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={locale === lang.code ? 'active' : ''}
                    >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};