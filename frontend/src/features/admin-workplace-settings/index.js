// frontend/src/features/admin-workplace-settings/index.js
import React, {useState, useEffect} from 'react';
import {Container, Nav, Tab, Card} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import {useI18n} from 'shared/lib/i18n/i18nProvider';

import WorkSitesTab from './ui/WorkSitesTab/WorkSitesTab';
import PositionsTab from './ui/PositionsTab/PositionsTab';
import DisplaySettingsTab from './ui/DisplaySettingsTab/DisplaySettingsTab';

import {fetchPositions, fetchWorkSites} from './model/workplaceSlice';

import './index.css';

const WorkplaceSettings = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('worksites');
    const [selectedSite, setSelectedSite] = useState(null);

    const {loading} = useSelector(state => state.workplace);

    useEffect(() => {
        if (activeTab === 'positions') {
            dispatch(fetchPositions());
        }
    }, [activeTab, dispatch]);

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
        // Сбрасываем выбранный сайт при переходе на другие вкладки
        if (key !== 'positions') {
            setSelectedSite(null);
        }
    };

    if (loading && !activeTab) {
        return (

                <Container fluid>
                    <LoadingState/>
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

                <Card className="border-0 shadow-sm">
                    <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                        <Card.Header className="border-bottom bg-none">
                            <Nav variant="tabs" className="nav-tabs-custom">
                                <Nav.Item>
                                    <Nav.Link eventKey="worksites">
                                        <i className="bi bi-building me-2"></i>
                                        {t('workplace.worksites.title')}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="positions">
                                        <i className="bi bi-person-badge me-2"></i>
                                        {t('workplace.positions.title')}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="display">
                                        <i className="bi bi-display me-2"></i>
                                        {t('workplace.displaySettings.title')}
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Header>
                        <Card className="border-top-0">
                            <Card.Body className="p-0">
                                <Tab.Content>
                                    <Tab.Pane eventKey="worksites">
                                        <WorkSitesTab onSelectSite={handleSiteSelection}/>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="positions">
                                        <PositionsTab selectedSite={selectedSite}/>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="display">
                                        <DisplaySettingsTab/>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Card.Body>
                        </Card>
                    </Tab.Container>
                </Card>
            </Container>
    );
};

export default WorkplaceSettings;