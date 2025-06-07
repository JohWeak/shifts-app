// frontend/src/components/admin/AlgorithmSettings.js
import React from 'react';
import AdminLayout from './AdminLayout';
import { Container, Card } from 'react-bootstrap';

const AlgorithmSettings = () => {
    return (
        <AdminLayout>
            <Container fluid className="px-0">
                <div className="mb-4">
                    <h1 className="h3 mb-2 text-dark fw-bold">
                        <i className="bi bi-cpu-fill me-2 text-primary"></i>
                        Algorithm Settings
                    </h1>
                    <p className="text-muted mb-0">Configure scheduling algorithms and constraints</p>
                </div>

                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <i className="bi bi-gear-fill display-1 text-muted mb-3"></i>
                        <h4 className="text-muted">Coming Soon</h4>
                        <p className="text-muted">Algorithm configuration panel will be available here</p>
                    </Card.Body>
                </Card>
            </Container>
        </AdminLayout>
    );
};

export default AlgorithmSettings;