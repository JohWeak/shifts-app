// frontend/src/features/admin-workplace-settings/ui/WorkplaceSettingsSkeleton.js
import React from 'react';
import {Card, Container, Nav, Placeholder, Table} from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import "./WorkplaceSettingsSkeleton.css"
import SortableHeader from "../../../../shared/ui/components/SortableHeader";

const WorkplaceSettingsSkeleton = () => {
    const {t} = useI18n();

    // Helper to generate multiple skeleton rows
    const renderSkeletonRows = (count) => {
        return Array.from({length: count}).map((_, index) => (
            <tr key={index}>
                <td><Placeholder xs={8} className="ms-2"/></td>
                <td><Placeholder xs={10}/></td>
                <td><Placeholder xs={7}/></td>
                <td><Placeholder xs={3}/></td>
                <td><Placeholder xs={3}/></td>
                <td><Placeholder xs={6}/></td>
                <td className="text-center"><Placeholder xs={6}/></td>
            </tr>
        ));
    };

    return (
        <Container fluid className="p-1 workplace-settings-container workplace-settings-placeholder">
            <PageHeader
                icon="building"
                title={t('workplace.title')}
                subtitle={t('workplace.subtitle')}
            />

            <Card className="workplace-card-container border-0 shadow-sm">
                <Card.Header className="workplace-card-header border-bottom bg-none">
                    <Nav variant="tabs" className="nav-tabs-custom">
                        <Nav.Item>
                            <Nav.Link eventKey="worksites" active>
                                <i className="bi bi-building me-2"></i>
                                {t('workplace.worksites.title')}
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="positions" disabled>
                                <i className="bi bi-person-badge me-2"></i>
                                {t('workplace.positions.title')}
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body className="p-0 workplace-card-body">
                    <Card className="workplace-tab-content">
                        {/* Use glow animation on the parent for a coordinated effect */}
                        <Placeholder as={Card.Header} animation="glow"
                                     className="d-flex justify-content-between align-items-center ">
                            <Placeholder className="skeleton-h5"/>
                            <Placeholder.Button/>
                        </Placeholder>
                        <Placeholder as={Card.Body} animation="glow" className="px-0">
                            {/* Toolbar Skeleton */}
                            <div
                                className="workplace-toolbar skeleton-toolbar d-flex justify-content-between px-3 py-2">
                                <Placeholder style={{width: '70%'}}/>
                                <Placeholder style={{width: '20%'}}/>
                            </div>

                            {/* Table Skeleton */}
                            <Table responsive hover className="workplace-table">
                                <thead>
                                <tr>
                                    <SortableHeader>{t('workplace.worksites.name')}</SortableHeader>
                                    <SortableHeader>{t('workplace.worksites.address')}</SortableHeader>
                                    <SortableHeader>{t('workplace.worksites.phone')}</SortableHeader>
                                    <SortableHeader>{t('workplace.worksites.positions')}</SortableHeader>
                                    <SortableHeader>{t('workplace.worksites.employees')}</SortableHeader>
                                    <SortableHeader>{t('common.status')}</SortableHeader>
                                    <SortableHeader className="ps-5">{t('common.actions')}</SortableHeader>
                                </tr>
                                </thead>
                                <tbody>
                                {/* Now we render placeholders inside the cells */}
                                {renderSkeletonRows(5)}
                                </tbody>
                            </Table>
                        </Placeholder>
                    </Card>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default WorkplaceSettingsSkeleton;