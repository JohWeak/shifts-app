import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useI18n } from '../../lib/i18n/i18nProvider';

class ErrorBoundaryClass extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <Alert variant="danger" className="m-4">
                    <Alert.Heading>Something went wrong</Alert.Heading>
                    <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                    <hr />
                    <Button
                        variant="outline-danger"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </Alert>
            );
        }

        return this.props.children;
    }
}

// Wrapper component to use hooks
export const ErrorBoundary = ({ children, fallback }) => {
    const { t } = useI18n();

    const errorFallback = fallback || (
        <Alert variant="danger" className="m-4">
            <Alert.Heading>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {t('errors.unexpectedError')}
            </Alert.Heading>
            <p>{t('errors.networkError')}</p>
            <hr />
            <Button
                variant="outline-danger"
                onClick={() => window.location.reload()}
            >
                {t('common.reload')}
            </Button>
        </Alert>
    );

    return (
        <ErrorBoundaryClass fallback={errorFallback}>
            {children}
        </ErrorBoundaryClass>
    );
};