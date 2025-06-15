import React from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingState.css';

const LoadingState = ({ message, size = 'md' }) => {
    const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '';

    return (
        <div className={`loading-state loading-state-${size}`}>
            <Spinner animation="border" variant="primary" size={spinnerSize} />
            {message && <p className="loading-state-message mt-3">{message}</p>}
        </div>
    );
};

export default LoadingState;