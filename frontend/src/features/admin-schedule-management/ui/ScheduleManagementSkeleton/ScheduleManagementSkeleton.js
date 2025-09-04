// frontend/src/features/admin-schedule-management/ui/ScheduleManagementSkeleton/ScheduleManagementSkeleton.js
import React from 'react';
import { Card, Container, Placeholder, Table } from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ScheduleManagementSkeleton.css';

const ScheduleManagementSkeleton = () => {
    const { t } = useI18n();

    // Helper to generate multiple skeleton rows
    const renderSkeletonRows = (count) => {
        return Array.from({ length: count }).map((_, index) => (
            <tr key={index}>
                <td><Placeholder xs={8} className="ms-2" /></td>
                <td><Placeholder xs={10} /></td>
                <td><Placeholder xs={7} /></td>
                <td><Placeholder xs={4} /></td>
                <td className="text-center"><Placeholder xs={6} /></td>
            </tr>
        ));
    };

    return (
        <div className="schedule-management-wrapper">
            <div className="schedule-management-content">
                <Container fluid className="p-1 admin-schedule-management-container schedule-management-placeholder">
                    <PageHeader
                        icon="calendar-week"
                        title={t('schedule.title')}
                        subtitle={t('schedule.subtitle')}
                    >
                        <Placeholder.Button style={{ width: 200 }} />
                    </PageHeader>

                    <Card className="schedule-list-card mb-4">
                        <Card.Header className="schedule-list-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <Placeholder className="skeleton-h5" />
                            </div>
                        </Card.Header>

                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table className="schedule-overview-table mb-0">
                                    <thead>
                                    <tr>
                                        <th>{t('schedule.weekPeriod')}</th>
                                        <th>{t('schedule.site')}</th>
                                        <th>{t('common.lastUpdated')}</th>
                                        <th>{t('schedule.status')}</th>
                                        <th className="text-center actions-header">{t('common.actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {renderSkeletonRows(5)}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </div>
    );
};

export default ScheduleManagementSkeleton;