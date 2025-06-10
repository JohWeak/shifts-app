// frontend/src/components/admin/common/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Обновляем состояние, чтобы следующий рендер показал fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Логируем ошибку
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error info:', errorInfo);

        // Сохраняем информацию об ошибке в состоянии
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container mt-5">
                    <div className="alert alert-danger">
                        <h4>
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Something went wrong
                        </h4>
                        <p>An error occurred while rendering this component. Please try refreshing the page.</p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-3">
                                <summary>Error details (Development mode)</summary>
                                <div className="mt-2">
                                    <strong>Error:</strong>
                                    <pre className="bg-light p-2 mt-1 small">
                                        {this.state.error.toString()}
                                    </pre>

                                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                                        <>
                                            <strong>Component Stack:</strong>
                                            <pre className="bg-light p-2 mt-1 small">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </>
                                    )}

                                    {this.state.error.stack && (
                                        <>
                                            <strong>Stack Trace:</strong>
                                            <pre className="bg-light p-2 mt-1 small">
                                                {this.state.error.stack}
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
                                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                            >
                                <i className="bi bi-arrow-left me-1"></i>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;