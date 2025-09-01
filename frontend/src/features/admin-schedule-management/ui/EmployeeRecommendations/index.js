// frontend/src/features/admin-schedule-management/ui/EmployeeRecommendations/index.js

import React, {useEffect, useState} from 'react';
import {Alert, Badge, Form, Tab, Tabs} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {fetchRecommendations} from '../../model/scheduleSlice';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState';
import EmployeeList from './components/EmployeeList';
import UnavailableEmployeeGroups from './components/UnavailableEmployeeGroups';
import './EmployeeRecommendations.css';

const EmployeeRecommendations = ({
                                     selectedPosition,
                                     onEmployeeSelect,
                                     scheduleDetails,
                                     isVisible = true,
                                     onTabChange = null,
                                 }) => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const {recommendations, recommendationsLoading, error, pendingChanges} = useSelector(state => state.schedule);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('available');

    useEffect(() => {
        if (isVisible && selectedPosition && scheduleDetails?.schedule?.id) {
            dispatch(fetchRecommendations({
                positionId: selectedPosition.positionId,
                shiftId: selectedPosition.shiftId,
                date: selectedPosition.date,
                scheduleId: scheduleDetails.schedule.id,
            }));
        }
    }, [isVisible, selectedPosition, scheduleDetails, pendingChanges, dispatch]);

    // Determine the best tab based on recommendations data
    useEffect(() => {
        if (!recommendations) return;

        const savedTab = localStorage.getItem('recommendationActiveTab');
        let bestTab;

        // Priority: available > cross_position > other_site > unavailable
        if (recommendations.available?.length > 0) {
            bestTab = 'available';
        } else if (recommendations.cross_position?.length > 0) {
            bestTab = 'cross_position';
        } else if (recommendations.other_site?.length > 0) {
            bestTab = 'other_site';
        } else {
            bestTab = 'unavailable';
        }

        // Check if saved tab has data
        const hasDataForSavedTab = () => {
            if (!savedTab) return false;
            if (savedTab === 'unavailable') {
                const countUnavailable = (recommendations.unavailable_soft?.length || 0) +
                    (recommendations.unavailable_hard?.length || 0) +
                    (recommendations.unavailable_busy?.length || 0) +
                    (recommendations.unavailable_permanent?.length || 0);
                return countUnavailable > 0;
            }
            return recommendations[savedTab]?.length > 0;
        };

        // Use saved tab if it has data, otherwise use best tab
        if (hasDataForSavedTab()) {
            setActiveTab(savedTab);
        } else {
            setActiveTab(bestTab);
        }
    }, [recommendations]);

    useEffect(() => {
        localStorage.setItem('recommendationActiveTab', activeTab);
        if (onTabChange) {
            onTabChange(activeTab);
        }
    }, [activeTab, onTabChange]);

    if (!selectedPosition || !scheduleDetails) {
        return (
            <div className="employee-recommendations p-4 text-center">
                <p className="text-muted">{t('employee.selectPositionFirst')}</p>
            </div>
        );
    }

    const countUnavailable = (recommendations?.unavailable_soft?.length || 0) +
        (recommendations?.unavailable_hard?.length || 0) +
        (recommendations?.unavailable_busy?.length || 0) +
        (recommendations?.unavailable_permanent?.length || 0);

    return (
        <div className="employee-recommendations" style={{containerType: 'inline-size'}}>
            <Form.Group className="search-container">
                <Form.Control
                    type="text"
                    placeholder={t('employee.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={recommendationsLoading === 'pending'}
                    className="search-input"
                />
            </Form.Group>

            {recommendationsLoading === 'pending' && <LoadingState message={t('common.loading')}/>}
            {error && <Alert variant="danger"><i className="bi bi-exclamation-triangle me-2"></i>{error}</Alert>}

            {recommendationsLoading !== 'pending' && !error && (
                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                    <Tab
                        eventKey="available"
                        title={<span><Badge bg="success" pill
                                            className="me-2">{recommendations?.available?.length || 0}</Badge>{t('employee.tabs.available')}</span>}
                    >
                        <EmployeeList employees={recommendations?.available} type="available"
                                      onItemClick={onEmployeeSelect} searchTerm={searchTerm}/>
                    </Tab>
                    <Tab
                        eventKey="unavailable"
                        title={<span><Badge bg="danger" pill
                                            className="me-2">{countUnavailable}</Badge>{t('employee.tabs.unavailable')}</span>}
                    >
                        <UnavailableEmployeeGroups recommendations={recommendations} onItemClick={onEmployeeSelect}
                                                   searchTerm={searchTerm}/>
                    </Tab>
                    <Tab
                        eventKey="cross_position"
                        title={<span><Badge bg="warning" pill
                                            className="me-2">{recommendations?.cross_position?.length || 0}</Badge>{t('employee.tabs.crossPosition')}</span>}
                    >
                        <EmployeeList employees={recommendations?.cross_position} type="cross_position"
                                      onItemClick={onEmployeeSelect} searchTerm={searchTerm}/>
                    </Tab>
                    <Tab
                        eventKey="other_site"
                        title={<span><Badge bg="info" pill
                                            className="me-2">{recommendations?.other_site?.length || 0}</Badge>{t('employee.tabs.otherSite')}</span>}
                    >
                        <EmployeeList employees={recommendations?.other_site} type="other_site"
                                      onItemClick={onEmployeeSelect} searchTerm={searchTerm}/>
                    </Tab>
                </Tabs>
            )}
        </div>
    );
};

export default EmployeeRecommendations;