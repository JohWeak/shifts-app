// frontend/src/CompareAlgorithmsModal.js/admin/common/ErrorBoundaryHook.js
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div className="container mt-5">
            <div className="alert alert-danger">
                <h4>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Something went wrong
                </h4>
                <p>An error occurred while rendering this component. Please try again.</p>

                {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-3">
                        <summary>Error details (Development mode)</summary>
                        <div className="mt-2">
                            <strong>Error:</strong>
                            <pre className="bg-light p-2 mt-1 small">
                                {error.toString()}
                            </pre>

                            {error.stack && (
                                <>
                                    <strong>Stack Trace:</strong>
                                    <pre className="bg-light p-2 mt-1 small">
                                        {error.stack}
                                    </pre>
                                </>
                            )}
                        </div>
                    </details>
                )}

                <div className="mt-3">
                    <button
                        className="btn btn-primary me-2"
                        onClick={() => window.location.reload()}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Reload Page
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={resetErrorBoundary}
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}

const AppErrorBoundary = ({ children }) => {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
                console.error('Error caught by boundary:', error);
                console.error('Error info:', errorInfo);
            }}
        >
            {children}
        </ErrorBoundary>
    );
};

export default AppErrorBoundary;