import React, { useState, useEffect } from 'react';
import { Container, Nav, Tab, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import TopProgressBar from "../../shared/ui/components/TopProgressBar/TopProgressBar";

import { useI18n } from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import WorkSitesTab from './ui/WorkSitesTab';
import PositionsTab from './ui/PositionsTab';
import DisplaySettingsTab from './ui/DisplaySettingsTab';

import { preloadWorkplaceData } from './model/workplaceSlice';

import './index.css';

const WorkplaceSettings = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('worksites');
    const [selectedSite, setSelectedSite] = useState(null);
    const [isPreloading, setIsPreloading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsPreloading(true);
            try {
                await dispatch(preloadWorkplaceData());
            } finally {
                setIsPreloading(false);
            }
        };

        void loadData();
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

    const tabAnimationVariants = {
        initial: {
            opacity: 0,
            x: 15
        },
        animate: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.25,
                ease: 'easeOut'
            }
        },
        exit: {
            opacity: 0,
            x: -15,
            transition: {
                duration: 0.15,
                ease: 'easeIn'
            }
        }
    };

    if (isPreloading) {
        return (
            <Container fluid>
                <TopProgressBar />
                <LoadingState />
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
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={tabAnimationVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {activeTab === 'worksites' &&
                                    <WorkSitesTab onSelectSite={handleSiteSelection} />}
                                {activeTab === 'positions' &&
                                    <PositionsTab selectedSite={selectedSite} />}
                                {activeTab === 'display' &&
                                    <DisplaySettingsTab />}
                            </motion.div>
                        </AnimatePresence>
                    </Card.Body>
                </Tab.Container>
            </Card>
        </Container>
    );
};

export default WorkplaceSettings;