//frontend/src/shared/ui/layouts/EmployeeLayout/EmployeeLayout.jsimport React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';


const EmployeeLayout = ({ children }) => {
    const { isAuthenticated, loading } = useSelector(state => state.auth);

    if (loading === 'pending') {
        return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default EmployeeLayout;