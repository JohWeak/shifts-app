import React from 'react';
import AdminLayout from '../../widgets/AdminLayout/AdminLayout';
import { Container, Card } from 'react-bootstrap';
import PageHeader from '../../shared/ui/PageHeader/PageHeader';
import {useI18n} from "../../shared/lib/i18n/i18nProvider";

const Reports = () => {
    const { t } = useI18n();

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                <PageHeader
                    icon="graph-up-arrow"
                    title={t('reports.analyticsAndReports')}
                    subtitle={t('reports.analyticsDesc')}
                />

                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <i className="bi bi-graph-up-arrow display-1 text-muted mb-3"></i>
                        <h4 className="text-muted">Coming Soon</h4>
                        <p className="text-muted">Advanced analytics and reporting features will be available here</p>
                    </Card.Body>
                </Card>
            </Container>
        </AdminLayout>
    );
};

export default Reports;