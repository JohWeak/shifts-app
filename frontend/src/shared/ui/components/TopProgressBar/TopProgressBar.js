// frontend/src/shared/ui/components/TopProgressBar/index.js

import React from 'react';
import './TopProgressBar.css';


const TopProgressBar = () => {
    return (
        <div className="top-progress-bar" aria-busy="true" aria-live="polite">
            <div className="top-progress-bar-inner"></div>
        </div>
    );
};

export default TopProgressBar;