// frontend/src/features/admin-schedule-management/ui/components/EmployeeRecommendations/EmployeeRecommendations.js
import React, {useState, useEffect} from 'react';
import {ListGroup, Badge, Alert, Form, Tab, Tabs} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {fetchRecommendations} from '../../../model/scheduleSlice';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import './EmployeeRecommendations.css';

const EmployeeRecommendations = ({
                                     selectedPosition,
                                     onEmployeeSelect,
                                     scheduleDetails,
                                     isVisible = true,
                                     onTabChange = null
                                 }) => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const {recommendations, recommendationsLoading, error} = useSelector(state => state.schedule);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(() =>
        localStorage.getItem('recommendationActiveTab') || 'available'
    );

    useEffect(() => {
        if (isVisible && selectedPosition && scheduleDetails?.schedule?.id) {
            dispatch(fetchRecommendations({
                positionId: selectedPosition.positionId,
                shiftId: selectedPosition.shiftId,
                date: selectedPosition.date,
                scheduleId: scheduleDetails.schedule.id,
            })).then(action => {
                if (fetchRecommendations.fulfilled.match(action)) {
                    const data = action.payload;
                    if (data.available.length === 0 && data.cross_position.length > 0) {
                        setActiveTab('cross_position');
                    } else if (data.available.length === 0 && data.cross_position.length === 0) {
                        setActiveTab('unavailable');
                    } else {
                        setActiveTab('available');
                    }
                }
            });
        }
    }, [isVisible, selectedPosition, scheduleDetails, dispatch]);

    useEffect(() => {
        console.log('EmployeeRecommendations: fetching recommendations', {
            isVisible,
            hasPosition: !!selectedPosition,
            hasSchedule: !!scheduleDetails?.schedule?.id
        });

        if (isVisible && selectedPosition && scheduleDetails?.schedule?.id) {
            dispatch(fetchRecommendations({
                positionId: selectedPosition.positionId,
                shiftId: selectedPosition.shiftId,
                date: selectedPosition.date,
                scheduleId: scheduleDetails.schedule.id,
            })).then(action => {
                console.log('Recommendations fetched:', action.type);
                // ... остальной код
            });
        }
    }, [isVisible, selectedPosition, scheduleDetails, dispatch]);

    // Save active tab to localStorage
    useEffect(() => {
        localStorage.setItem('recommendationActiveTab', activeTab);
        if (onTabChange) {
            onTabChange(activeTab);
        }
    }, [activeTab, onTabChange]);

    const filterEmployees = (employees) => {
        if (!searchTerm) return employees;
        return employees.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const renderEmployeeList = (employees, type) => {
        const filtered = filterEmployees(employees);

        if (filtered.length === 0) {
            return (
                <Alert variant="info" className="mt-3">
                    <i className="bi bi-info-circle me-2"></i>
                    {searchTerm ? t('employee.noMatchingEmployees') : t('employee.noEmployeesInCategory')}
                </Alert>
            );
        }

        return (
            <ListGroup>
                {filtered.map(employee => {
                    const isFlexible = !employee.default_position_id || employee.flexible_position;
                    const isAvailable = type === 'available' || type === 'cross_position' || type === 'other_site';
                    const showWarning = !isAvailable;

                    return (
                        <ListGroup.Item
                            key={employee.emp_id}
                            action
                            onClick={() => handleEmployeeClick(employee, showWarning)}
                            className={`employee-list-item ${showWarning ? 'list-group-item-warning' : ''} ${isFlexible ? 'flexible-employee' : ''}`}
                        >
                            <div className="employee-info">
                                <div>
                                    <div className="employee-name">
                                        {employee.first_name} {employee.last_name}
                                    </div>

                                    <div className="employee-site">
                                        <i className="bi bi-building me-1"></i>
                                        {employee.work_site_name || t('employee.noWorkSite')}
                                    </div>

                                    <div className="employee-position">
                                        <i className="bi bi-person-badge me-1"></i>
                                        {employee.default_position_name || t('employee.flexiblePosition')}
                                    </div>

                                    {/* For UNAVAILABLE employees - show specific reason */}
                                    {showWarning && (
                                        <>
                                            {employee.unavailable_reason === 'already_assigned' && (
                                                <div className="mt-2 text-danger">
                                                    <i className="bi bi-calendar-check me-1"></i>
                                                    {t('recommendation.already_assigned_to', [employee.assigned_shift || t('recommendation.unknown_shift')])}
                                                </div>
                                            )}

                                            {employee.unavailable_reason === 'permanent_constraint' &&
                                                employee.constraint_details?.[0] && (
                                                    <div className="permanent-constraint-info mt-2">
                                                        <div className="text-danger">
                                                            <i className="bi bi-lock-fill me-1"></i>
                                                            {t('employee.permanentConstraint')}
                                                        </div>
                                                        <small className="text-muted d-block ms-3">
                                                            {t('employee.approvedBy', {
                                                                approver: employee.constraint_details[0].approved_by,
                                                                date: new Date(employee.constraint_details[0].approved_at).toLocaleDateString()
                                                            })}
                                                        </small>
                                                    </div>
                                                )}

                                            {employee.unavailable_reason === 'rest_violation' && employee.rest_details && (
                                                <div className="mt-2 text-danger">
                                                    <i className="bi bi-moon me-1"></i>
                                                    {employee.rest_details.type === 'after'
                                                        ? t('recommendation.rest_violation_after', [
                                                            employee.rest_details.restHours,
                                                            employee.rest_details.previousShift,
                                                            employee.rest_details.requiredRest
                                                        ])
                                                        : t('recommendation.rest_violation_before', [
                                                            employee.rest_details.restHours,
                                                            employee.rest_details.nextShift,
                                                            employee.rest_details.requiredRest
                                                        ])
                                                    }
                                                </div>
                                            )}

                                            {employee.unavailable_reason === 'hard_constraint' && (
                                                <div className="mt-2 text-danger">
                                                    <i className="bi bi-x-circle me-1"></i>
                                                    {t('recommendation.Cannot work')}
                                                </div>
                                            )}

                                            {employee.unavailable_reason === 'soft_constraint' && (
                                                <div className="mt-2 text-danger">
                                                    <i className="bi bi-dash-circle me-1"></i>
                                                    {t('recommendation.prefer_different_time')}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* For AVAILABLE employees - show reasons and warnings */}
                                    {isAvailable && (
                                        <>
                                            {employee.recommendation?.reasons?.map((reason, idx) => {
                                                const parts = reason.split(':');
                                                const key = parts[0];
                                                const params = parts.slice(1);
                                                const translationKey = `recommendation.${key}`;
                                                const translation = t(translationKey, params);

                                                if (translation && translation !== translationKey) {
                                                    return (
                                                        <small key={idx} className="d-block text-success">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            {translation}
                                                        </small>
                                                    );
                                                }
                                                return null;
                                            })}

                                            {employee.recommendation?.warnings?.map((warning, idx) => {
                                                const parts = warning.split(':');
                                                const key = parts[0];
                                                const params = parts.slice(1);
                                                const translationKey = `recommendation.${key}`;
                                                const translation = t(translationKey, params);

                                                if (translation && translation !== translationKey) {
                                                    return (
                                                        <small key={idx} className="d-block text-warning">
                                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                                            {translation}
                                                        </small>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="employee-badges">
                                {employee.recommendation?.score ? (
                                    <small className="score-badge">
                                        {t('employee.score')}: {employee.recommendation.score}
                                    </small>
                                ) : (
                                    <small className="score-badge">
                                        {t('employee.score')}: 0
                                    </small>
                                )}
                                {type === 'available' && (
                                    <Badge bg="success">{t('employee.available')}</Badge>
                                )}
                                {type === 'cross_position' && (
                                    <Badge bg="warning" text="dark">{t('employee.crossPosition')}</Badge>
                                )}
                                {type === 'other_site' && (
                                    <Badge bg="info">{t('employee.otherSite')}</Badge>
                                )}
                                {isFlexible && (
                                    <Badge bg="secondary">{t('employee.flexible')}</Badge>
                                )}
                                {showWarning && (
                                    <Badge bg="danger">{t('employee.unavailable')}</Badge>
                                )}
                            </div>
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
        );
    };

    const handleEmployeeClick = (employee, showWarning) => {
        if (showWarning) {
            const confirmAssign = window.confirm(
                t('employee.confirmOverride', {
                    name: `${employee.first_name} ${employee.last_name}`,
                    reason: employee.unavailable_reason?.replace('_', ' ') || 'N/A',
                    note: employee.note || ''
                })
            );
            if (confirmAssign) {
                onEmployeeSelect(employee.emp_id, `${employee.first_name} ${employee.last_name}`);
            }
        } else {
            onEmployeeSelect(employee.emp_id, `${employee.first_name} ${employee.last_name}`);
        }
    };

    const groupUnavailableEmployees = () => {
        const groups = {
            temporary: [],
            permanent: [],
            legal: []
        };

        if (recommendations?.unavailable_soft) {
            groups.temporary.push(...recommendations.unavailable_soft);
        }
        if (recommendations?.unavailable_hard) {
            groups.temporary.push(...recommendations.unavailable_hard.filter(
                emp => emp.unavailable_reason !== 'permanent_constraint' &&
                    emp.unavailable_reason !== 'rest_violation'
            ));
        }
        if (recommendations?.unavailable_permanent) {
            groups.permanent.push(...recommendations.unavailable_permanent);
        }
        if (recommendations?.unavailable_busy) {
            groups.legal.push(...recommendations.unavailable_busy);
        }
        if (recommendations?.unavailable_hard) {
            groups.legal.push(...recommendations.unavailable_hard.filter(
                emp => emp.unavailable_reason === 'rest_violation'
            ));
        }

        return groups;
    };

    return (
        <div className="employee-recommendations">
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

            {recommendationsLoading === 'pending' && (
                <LoadingState message={t('common.loading')}/>
            )}

            {error && (
                <Alert variant="danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </Alert>
            )}

            {recommendationsLoading !== 'pending' && !error && (
                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                    <Tab
                        eventKey="available"
                        title={
                            <span>
                                <Badge bg="success" pill className="me-2">
                                    {recommendations?.available?.length || 0}
                                </Badge>
                                {t('employee.tabs.available')}
                            </span>
                        }
                    >
                        {renderEmployeeList(recommendations?.available || [], 'available')}
                    </Tab>

                    <Tab
                        eventKey="unavailable"
                        title={
                            <span>
                                <Badge bg="danger" pill className="me-2">
                                    {(recommendations?.unavailable_soft?.length || 0) +
                                        (recommendations?.unavailable_hard?.length || 0) +
                                        (recommendations?.unavailable_busy?.length || 0) +
                                        (recommendations?.unavailable_permanent?.length || 0)}
                                </Badge>
                                {t('employee.tabs.unavailable')}

                            </span>
                        }
                    >
                        <div className="unavailable-groups">
                            {(() => {
                                const groups = groupUnavailableEmployees();

                                return (
                                    <>
                                        {groups.temporary.length > 0 && (
                                            <div className="unavailable-group">
                                                <h6 className="group-title">
                                                    {t('employee.temporaryConstraints')}
                                                </h6>
                                                {renderEmployeeList(groups.temporary, 'unavailable_temporary')}
                                            </div>
                                        )}

                                        {groups.permanent.length > 0 && (
                                            <div className="unavailable-group">
                                                <h6 className="group-title">
                                                    {t('employee.permanentConstraints')}
                                                </h6>
                                                {renderEmployeeList(groups.permanent, 'unavailable_permanent')}
                                            </div>
                                        )}

                                        {groups.legal.length > 0 && (
                                            <div className="unavailable-group">
                                                <h6 className="group-title">
                                                    {t('employee.legalConstraints')}
                                                </h6>
                                                {renderEmployeeList(groups.legal, 'unavailable_legal')}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </Tab>

                    <Tab
                        eventKey="cross_position"
                        title={
                            <span>
                                <Badge bg="warning" pill className="me-2">
                                    {recommendations?.cross_position?.length || 0}
                                </Badge>
                                {t('employee.tabs.crossPosition')}

                            </span>
                        }
                    >
                        {renderEmployeeList(recommendations?.cross_position || [], 'cross_position')}
                    </Tab>

                    <Tab
                        eventKey="other_site"
                        title={
                            <span>
                                <Badge bg="info" pill className="me-2">
                                    {recommendations?.other_site?.length || 0}
                                </Badge>
                                {t('employee.tabs.otherSite')}

                            </span>
                        }
                    >
                        {renderEmployeeList(recommendations?.other_site || [], 'other_site')}
                    </Tab>

                </Tabs>
            )}
        </div>
    );
};

export default EmployeeRecommendations;