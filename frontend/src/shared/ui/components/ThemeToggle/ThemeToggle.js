import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'button' }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={toggleTheme}
                className="theme-toggle-icon"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}`}></i>
            </button>
        );
    }

    return (
        <Button
            variant="outline-secondary"
            size="sm"
            onClick={toggleTheme}
            className="theme-toggle-btn ms-2"
        >
            <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}`}></i>
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </Button>
    );
};

export default ThemeToggle;