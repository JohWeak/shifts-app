// LoadingState.js
import React from 'react';
import './LoadingState.css';

const LoadingState = ({ message, size = 'md' }) => {
    return (
        <div className={`loading-state loading-state-${size}`}>
            <div className="progress-bar-container">
                <div className="progress-bar-indeterminate"></div>
            </div>
            {message && <p className="loading-state-message mt-3">{message}</p>}
        </div>
    );
};

export default LoadingState;