// frontend/src/features/admin-schedule-management/ui/panels/EmployeeRecommendationPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { Nav, Badge, Alert, Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../../model/scheduleSlice';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import './EmployeeRecommendationPanel.css';

const EmployeeRecommendationPanel = ({
                                         isOpen,
                                         onClose,
                                         selectedPosition,
                                         onEmployeeSelect,
                                         scheduleDetails,
                                         panelWidth = 30 // Default width percentage
                                     }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { recommendations, recommendationsLoading, error } = useSelector(state => state.schedule);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(() =>
        localStorage.getItem('recommendationActiveTab') || 'available'
    );
    const [currentPanelWidth, setCurrentPanelWidth] = useState(() =>
        parseInt(localStorage.getItem('recommendationPanelWidth')) || panelWidth
    );
    const [isResizing, setIsResizing] = useState(false);

    const panelRef = useRef(null);
    const resizeHandleRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    // Load recommendations when position changes
    useEffect(() => {
        if (isOpen && selectedPosition && scheduleDetails?.schedule?.id) {
            dispatch(fetchRecommendations({
                positionId: selectedPosition.positionId,
                shiftId: selectedPosition.shiftId,
                date: selectedPosition.date,
                scheduleId: scheduleDetails.schedule.id,
            })).then(action => {
                if (fetchRecommendations.fulfilled.match(action)) {
                    const data = action.payload;

                    // Auto-switch to tab with results when searching
                    if (searchTerm) {
                        const tabs = ['available', 'cross_position', 'other_site', 'unavailable'];
                        for (const tab of tabs) {
                            if (data[tab]?.some(emp =>
                                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                            )) {
                                setActiveTab(tab);
                                break;
                            }
                        }
                    } else if (data.available.length === 0) {
                        if (data.cross_position.length > 0) {
                            setActiveTab('cross_position');
                        } else if (data.other_site.length > 0) {
                            setActiveTab('other_site');
                        } else {
                            setActiveTab('unavailable');
                        }
                    }
                }
            });
        }
    }, [isOpen, selectedPosition, scheduleDetails, dispatch, searchTerm]);

    // Save active tab to localStorage
    useEffect(() => {
        localStorage.setItem('recommendationActiveTab', activeTab);
    }, [activeTab]);

    // Save panel width to localStorage
    useEffect(() => {
        localStorage.setItem('recommendationPanelWidth', currentPanelWidth.toString());
    }, [currentPanelWidth]);

    // Handle resize
    const handleMouseDown = (e) => {
        setIsResizing(true);
        startXRef.current = e.pageX;
        startWidthRef.current = currentPanelWidth;
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const containerWidth = window.innerWidth;
            const isRTL = document.dir === 'rtl';

            let diff = isRTL ? startXRef.current - e.pageX : e.pageX - startXRef.current;
            let newWidthPercent = startWidthRef.current - (diff / containerWidth * 100);

            // Limit width between 20% and 50%
            newWidthPercent = Math.max(20, Math.min(50, newWidthPercent));
            setCurrentPanelWidth(newWidthPercent);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const tabs = ['available', 'cross_position', 'other_site', 'unavailable'];
                const currentIndex = tabs.indexOf(activeTab);
                const nextIndex = (currentIndex + 1) % tabs.length;
                setActiveTab(tabs[nextIndex]);
            } else if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                const tabs = ['available', 'cross_position', 'other_site', 'unavailable'];
                const currentIndex = tabs.indexOf(activeTab);
                const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                setActiveTab(tabs[prevIndex]);
            } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                // Select first available employee
                const available = recommendations?.available || [];
                if (available.length > 0 && activeTab === 'available') {
                    handleEmployeeSelect(available[0]);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeTab, recommendations, onClose]);

    const filterEmployees = (employees) => {
        if (!searchTerm) return employees;
        return employees.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleEmployeeSelect = (employee) => {
        const isUnavailable = employee.unavailable_reason;

        if (isUnavailable) {
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

    const renderEmployeeCard = (employee, type) => {
        const isAvailable = type === 'available' || type === 'cross_position' || type === 'other_site';
        const isUnavailable = !isAvailable;

        return (
            <div
                key={employee.emp_id}
                className={`employee-card ${isUnavailable ? 'unavailable' : ''} ${type}`}
                onClick={() => handleEmployeeSelect(employee)}
            >
                <div className="employee-card-header">
                    <div className="employee-name">
                        {employee.first_name} {employee.last_name}
                    </div>
                    {employee.recommendation?.score > 0 && (
                        <div className="employee-score">
                            {employee.recommendation.score}
                        </div>
                    )}
                </div>

                <div className="employee-info">
                    {employee.work_site_name && (
                        <div className="info-item">
                            <i className="bi bi-building"></i>
                            {employee.work_site_name}
                        </div>
                    )}
                    {employee.default_position_name && (
                        <div className="info-item">
                            <i className="bi bi-person-badge"></i>
                            {employee.default_position_name}
                        </div>
                    )}
                </div>

                {/* Show reasons for available employees */}
                {isAvailable && employee.recommendation?.reasons?.map((reason, idx) => {
                    const parts = reason.split(':');
                    const key = parts[0];
                    const params = parts.slice(1);
                    const translation = t(`recommendation.${key}`, params);

                    if (translation && translation !== `recommendation.${key}`) {
                        return (
                            <div key={idx} className="reason positive">
                                <i className="bi bi-check-circle"></i>
                                {translation}
                            </div>
                        );
                    }
                    return null;
                })}

                {/* Show warnings for available employees */}
                {isAvailable && employee.recommendation?.warnings?.map((warning, idx) => {
                    const parts = warning.split(':');
                    const key = parts[0];
                    const params = parts.slice(1);
                    const translation = t(`recommendation.${key}`, params);

                    if (translation && translation !== `recommendation.${key}`) {
                        return (
                            <div key={idx} className="reason warning">
                                <i className="bi bi-exclamation-triangle"></i>
                                {translation}
                            </div>
                        );
                    }
                    return null;
                })}

                {/* Show unavailable reason */}
                {isUnavailable && employee.unavailable_reason && (
                    <div className="unavailable-reason">
                        {employee.unavailable_reason === 'already_assigned' && (
                            <>
                                <i className="bi bi-calendar-check"></i>
                                {t('recommendation.already_assigned_to', [employee.assigned_shift])}
                            </>
                        )}
                        {employee.unavailable_reason === 'permanent_constraint' && (
                            <>
                                <i className="bi bi-lock-fill"></i>
                                {t('employee.permanentConstraint')}
                                {employee.constraint_details?.[0] && (
                                    <small className="d-block mt-1">
                                        {t('employee.approvedBy', {
                                            approver: employee.constraint_details[0].approved_by,
                                            date: new Date(employee.constraint_details[0].approved_at).toLocaleDateString()
                                        })}
                                    </small>
                                )}
                            </>
                        )}
                        {employee.unavailable_reason === 'rest_violation' && employee.rest_details && (
                            <>
                                <i className="bi bi-moon"></i>
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
                            </>
                        )}
                        {employee.unavailable_reason === 'hard_constraint' && (
                            <>
                                <i className="bi bi-x-circle"></i>
                                {t('recommendation.Cannot work')}
                            </>
                        )}
                        {employee.unavailable_reason === 'soft_constraint' && (
                            <>
                                <i className="bi bi-dash-circle"></i>
                                {t('recommendation.prefer_different_time')}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
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

    // Get panel title
    const getPanelTitle = () => {
        if (!selectedPosition || !scheduleDetails) return t('employee.selectEmployee');

        const shift = scheduleDetails.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails.positions?.find(p => p.pos_id === selectedPosition.positionId);
        const date = new Date(selectedPosition.date).toLocaleDateString();

        return `${position?.pos_name || ''} - ${shift?.shift_name || ''} (${date})`;
    };

    return (
        <div
            ref={panelRef}
            className={`recommendation-panel ${isOpen ? 'open' : ''}`}
            style={{ width: isOpen ? `${currentPanelWidth}%` : '0' }}
        >
            {/* Resize Handle */}
            <div
                ref={resizeHandleRef}
                className="resize-handle"
                onMouseDown={handleMouseDown}
            />

            {/* Panel Header */}
            <div className="panel-header">
                <div className="panel-title">
                    <h5>{getPanelTitle()}</h5>
                    <Button
                        variant="link"
                        className="close-btn"
                        onClick={onClose}
                    >
                        <i className="bi bi-x-lg"></i>
                    </Button>
                </div>

                {/* Search */}
                <Form.Control
                    type="text"
                    placeholder={t('employee.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Tabs */}
            <Nav variant="tabs" className="panel-tabs">
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'available'}
                        onClick={() => setActiveTab('available')}
                    >
                        {t('employee.tabs.available')}
                        <Badge bg="success" className="ms-2">
                            {recommendations?.available?.length || 0}
                        </Badge>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'cross_position'}
                        onClick={() => setActiveTab('cross_position')}
                    >
                        {t('employee.tabs.crossPosition')}
                        <Badge bg="warning" className="ms-2">
                            {recommendations?.cross_position?.length || 0}
                        </Badge>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'other_site'}
                        onClick={() => setActiveTab('other_site')}
                    >
                        {t('employee.tabs.otherSite')}
                        <Badge bg="info" className="ms-2">
                            {recommendations?.other_site?.length || 0}
                        </Badge>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'unavailable'}
                        onClick={() => setActiveTab('unavailable')}
                    >
                        {t('employee.tabs.unavailable')}
                        <Badge bg="danger" className="ms-2">
                            {(recommendations?.unavailable_soft?.length || 0) +
                                (recommendations?.unavailable_hard?.length || 0) +
                                (recommendations?.unavailable_busy?.length || 0) +
                                (recommendations?.unavailable_permanent?.length || 0)}
                        </Badge>
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {/* Content */}
            <div className="panel-content">
                {recommendationsLoading === 'pending' ? (
                    <LoadingState message={t('common.loading')} />
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : (
                    <>
                        {activeTab === 'available' && (
                            <div className="employees-list">
                                {filterEmployees(recommendations?.available || []).map(emp =>
                                    renderEmployeeCard(emp, 'available')
                                )}
                                {filterEmployees(recommendations?.available || []).length === 0 && (
                                    <Alert variant="info">{t('employee.noEmployeesInCategory')}</Alert>
                                )}
                            </div>
                        )}

                        {activeTab === 'cross_position' && (
                            <div className="employees-list">
                                {filterEmployees(recommendations?.cross_position || []).map(emp =>
                                    renderEmployeeCard(emp, 'cross_position')
                                )}
                                {filterEmployees(recommendations?.cross_position || []).length === 0 && (
                                    <Alert variant="info">{t('employee.noEmployeesInCategory')}</Alert>
                                )}
                            </div>
                        )}

                        {activeTab === 'other_site' && (
                            <div className="employees-list">
                                {filterEmployees(recommendations?.other_site || []).map(emp =>
                                    renderEmployeeCard(emp, 'other_site')
                                )}
                                {filterEmployees(recommendations?.other_site || []).length === 0 && (
                                    <Alert variant="info">{t('employee.noEmployeesInCategory')}</Alert>
                                )}
                            </div>
                        )}

                        {activeTab === 'unavailable' && (
                            <div className="unavailable-groups">
                                {(() => {
                                    const groups = groupUnavailableEmployees();
                                    return (
                                        <>
                                            {groups.temporary.length > 0 && (
                                                <div className="group">
                                                    <h6 className="group-title">{t('employee.temporaryConstraints')}</h6>
                                                    <div className="employees-list">
                                                        {filterEmployees(groups.temporary).map(emp =>
                                                            renderEmployeeCard(emp, 'unavailable_temporary')
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {groups.permanent.length > 0 && (
                                                <div className="group">
                                                    <h6 className="group-title">{t('employee.permanentConstraints')}</h6>
                                                    <div className="employees-list">
                                                        {filterEmployees(groups.permanent).map(emp =>
                                                            renderEmployeeCard(emp, 'unavailable_permanent')
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {groups.legal.length > 0 && (
                                                <div className="group">
                                                    <h6 className="group-title">{t('employee.legalConstraints')}</h6>
                                                    <div className="employees-list">
                                                        {filterEmployees(groups.legal).map(emp =>
                                                            renderEmployeeCard(emp, 'unavailable_legal')
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="panel-footer">
                <small className="text-muted">
                    ESC - {t('common.close')} | Tab - {t('common.switchTab')} | Enter - {t('common.selectFirst')}
                </small>
            </div>
        </div>
    );
};

export default EmployeeRecommendationPanel;