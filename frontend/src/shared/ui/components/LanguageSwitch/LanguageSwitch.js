// frontend/src/shared/ui/LanguageSwitch/LanguageSwitch.js
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useI18n } from '../../../lib/i18n/i18nProvider';
import './LanguageSwitch.css';

export const LanguageSwitch = () => {
    const { locale, changeLanguage } = useI18n();

    const languages = [
        { code: 'en', name: 'English', flag: '' },
        { code: 'he', name: 'עברית', flag: '' },
        { code: 'ru', name: 'Русский', flag: '' }
    ];

    return (
        <Dropdown className="language-switch" align="end">
            <Dropdown.Toggle variant="outline-secondary">
                {languages.find(lang => lang.code === locale)?.flag} {locale.toUpperCase()}
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {languages.map(lang => (
                    <Dropdown.Item
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                    >
                        {lang.flag} {lang.name}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};