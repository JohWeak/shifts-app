import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

const ThemeToggle = () => {
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

    return (
        <Button
            variant="outline-secondary"
            size="sm"
            onClick={toggleTheme}
            className="d-flex align-items-center"
        >
            <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'} me-2`}></i>
            <span className="d-none d-md-inline">
                {theme === 'light' ? 'Dark' : 'Light'}
            </span>
        </Button>
    );
};

export default ThemeToggle;