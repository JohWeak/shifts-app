import React, { useState, useEffect } from 'react';
import { Container, Nav, Tab, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import TopProgressBar from "../../shared/ui/components/TopProgressBar/TopProgressBar";

import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import WorkSitesTab from './ui/WorkSitesTab';
import PositionsTab from './ui/PositionsTab';
import DisplaySettingsTab from './ui/DisplaySettingsTab';

import { fetchPositions, fetchWorkSites } from './model/workplaceSlice';

import './index.css';

const WorkplaceSettings = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('worksites');
    const [selectedSite, setSelectedSite] = useState(null);
    const { loading, workSites } = useSelector(state => state.workplace);
    const hasData = workSites && workSites.length > 0;

    useEffect(() => {
        dispatch(fetchWorkSites());
        dispatch(fetchPositions());
    }, [dispatch]);

    const handleSiteSelection = (site) => {
        setSelectedSite(site);
        setActiveTab('positions');
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        if (key !== 'positions') {
            setSelectedSite(null);
        }
    };

    if (loading && !hasData) {
        return (
            <Container fluid>
                <TopProgressBar />
            </Container>
        );
    }

    return (
        <Container fluid className="p-1 workplace-settings-container">
            <PageHeader
                icon="building"
                title={t('workplace.title')}
                subtitle={t('workplace.subtitle')}
            />

            <Card className="workplace-card-container border-0 shadow-sm">
                <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
                    <Card.Header className="workplace-card-header border-bottom bg-none">
                        <Nav variant="tabs" className="nav-tabs-custom">
                            <Nav.Item><Nav.Link eventKey="worksites"><i className="bi bi-building me-2"></i>{t('workplace.worksites.title')}</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="positions"><i className="bi bi-person-badge me-2"></i>{t('workplace.positions.title')}</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="display"><i className="bi bi-display me-2"></i>{t('workplace.displaySettings.title')}</Nav.Link></Nav.Item>
                        </Nav>
                    </Card.Header>
                    <Card.Body className="p-0 workplace-card-body">
                        <Tab.Content>
                            <Tab.Pane eventKey="worksites" unmountOnExit={false}>
                                <WorkSitesTab onSelectSite={handleSiteSelection} />
                            </Tab.Pane>
                            <Tab.Pane eventKey="positions" unmountOnExit={false}>
                                <PositionsTab selectedSite={selectedSite} />
                            </Tab.Pane>
                            <Tab.Pane eventKey="display" unmountOnExit={false}>
                                <DisplaySettingsTab />
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Tab.Container>
            </Card>
        </Container>
    );
};

export default WorkplaceSettings;