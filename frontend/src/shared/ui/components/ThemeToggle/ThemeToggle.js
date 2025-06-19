import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import './ThemeToggle.css';

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
        <div className="theme-toggle">
            <Button
                variant="outline-secondary"
                size="sm"
                onClick={toggleTheme}
                className="theme-toggle-btn"
            >
                <i className={`bi bi-${theme === 'light' ? 'moon-stars' : 'sun'}`}></i>
            </Button>
        </div>
    );
};

export default ThemeToggle;