import React from 'react';
import AdminLayout from '../../widgets/AdminLayout/AdminLayout';
import { Container, Card } from 'react-bootstrap';
import PageHeader from '../../shared/ui/PageHeader/PageHeader';
import {useI18n} from "../../shared/lib/i18n/i18nProvider";
const EmployeeManagement = () => {
    const { t } = useI18n();

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                <PageHeader
                    icon="people-fill"
                    title={t('settings.employeeSettings')}
                    subtitle={t('settings.employeeSettingsSubtitle')}
                />

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