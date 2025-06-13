// frontend/src/CompareAlgorithmsModal.js/admin/EmployeeManagement.js
import React from 'react';
import AdminLayout from '../widgets/adminLayout/AdminLayout';
import { Container, Card } from 'react-bootstrap';

const EmployeeManagement = () => {
    return (
        <AdminLayout>
            <Container fluid className="px-0">
                <div className="mb-4">
                    <h1 className="h3 mb-2 text-dark fw-bold">
                        <i className="bi bi-people-fill me-2 text-primary"></i>
                        Employee Management
                    </h1>
                    <p className="text-muted mb-0">Manage employee accounts and permissions</p>
                </div>

                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <i className="bi bi-people-fill display-1 text-muted mb-3"></i>
                        <h4 className="text-muted">Coming Soon</h4>
                        <p className="text-muted">Employee management features will be available here</p>
                    </Card.Body>
                </Card>
            </Container>
        </AdminLayout>
    );
};

export default EmployeeManagement;