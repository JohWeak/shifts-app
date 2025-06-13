// frontend/src/CompareAlgorithmsModal.js/admin/common/LoadingSpinner.js
import React from 'react';
import { Spinner } from 'react-bootstrap';

export const LoadingSpinner = ({
                                   message = "Loading...",
                                   size = "border",
                                   variant = "primary",
                                   className = "text-center py-5"
                               }) => (
    <div className={className}>
        <Spinner animation={size} variant={variant} />
        <div className="mt-2">{message}</div>
    </div>
);

export default LoadingSpinner;