import React, { useState, useEffect } from 'react';
import { Alert, Form, Tab, Tabs, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../../model/scheduleSlice';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmployeeList from './components/EmployeeList';
import UnavailableEmployeeGroups from './components/UnavailableEmployeeGroups';
import './EmployeeRecommendations.css';

const EmployeeRecommendations = ({
                                     selectedPosition,
                                     onEmployeeSelect,
                                     scheduleDetails,
                                     isVisible = true,
                                     onTabChange = null
                                 }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { recommendations, recommendationsLoading, error, pendingChanges } = useSelector(state => state.schedule);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('recommendationActiveTab') || 'available');

    useEffect(() => {
        if (isVisible && selectedPosition && scheduleDetails?.schedule?.id) {
            dispatch(fetchRecommendations({
                positionId: selectedPosition.positionId,
                shiftId: selectedPosition.shiftId,
                date: selectedPosition.date,
                scheduleId: scheduleDetails.schedule.id
            }));
        }
    }, [isVisible, selectedPosition, scheduleDetails, pendingChanges, dispatch]);

    useEffect(() => {
        if (!recommendations) return;
        if (activeTab === 'available' && recommendations.available?.length === 0) {
            if (recommendations.cross_position?.length > 0) setActiveTab('cross_position');
            else if (recommendations.other_site?.length > 0) setActiveTab('other_site');
            else setActiveTab('unavailable');
        }
    }, [recommendations, activeTab]);

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
        <div className="employee-recommendations" style={{ containerType: 'inline-size' }}>
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

            {recommendationsLoading === 'pending' && <LoadingState message={t('common.loading')} />}
            {error && <Alert variant="danger"><i className="bi bi-exclamation-triangle me-2"></i>{error}</Alert>}

            {recommendationsLoading !== 'pending' && !error && (
                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                    <Tab
                        eventKey="available"
                        title={<span><Badge bg="success" pill className="me-2">{recommendations?.available?.length || 0}</Badge>{t('employee.tabs.available')}</span>}
                    >
                        <EmployeeList employees={recommendations?.available} type="available" onItemClick={onEmployeeSelect} searchTerm={searchTerm} />
                    </Tab>
                    <Tab
                        eventKey="unavailable"
                        title={<span><Badge bg="danger" pill className="me-2">{countUnavailable}</Badge>{t('employee.tabs.unavailable')}</span>}
                    >
                        <UnavailableEmployeeGroups recommendations={recommendations} onItemClick={onEmployeeSelect} searchTerm={searchTerm} />
                    </Tab>
                    <Tab
                        eventKey="cross_position"
                        title={<span><Badge bg="warning" pill className="me-2">{recommendations?.cross_position?.length || 0}</Badge>{t('employee.tabs.crossPosition')}</span>}
                    >
                        <EmployeeList employees={recommendations?.cross_position} type="cross_position" onItemClick={onEmployeeSelect} searchTerm={searchTerm} />
                    </Tab>
                    <Tab
                        eventKey="other_site"
                        title={<span><Badge bg="info" pill className="me-2">{recommendations?.other_site?.length || 0}</Badge>{t('employee.tabs.otherSite')}</span>}
                    >
                        <EmployeeList employees={recommendations?.other_site} type="other_site" onItemClick={onEmployeeSelect} searchTerm={searchTerm} />
                    </Tab>
                </Tabs>
            )}
        </div>
    );
};

export default EmployeeRecommendations;