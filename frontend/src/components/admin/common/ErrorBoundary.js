// frontend/src/components/admin/common/ErrorBoundary.js
import React, { Component } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to service
        console.error('Schedule Management Error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Card className="m-4">
                    <Card.Body className="text-center">
                        <i className="bi bi-exclamation-triangle display-1 text-danger"></i>
                        <h4 className="mt-3">Something went wrong</h4>
                        <p className="text-muted">
                            An error occurred in the schedule management interface.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <Alert variant="danger" className="mt-3 text-start">
                                <h6>Error Details:</h6>
                                <pre className="small">
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </Alert>
                        )}

                        <div className="mt-3">
                            <Button
                                variant="primary"
                                onClick={this.handleRetry}
                                className="me-2"
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Try Again
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={() => window.location.reload()}
                            >
                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                Reload Page
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;