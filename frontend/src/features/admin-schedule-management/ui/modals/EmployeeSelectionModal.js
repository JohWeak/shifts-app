// frontend/src/features/admin-schedule-management/components/EmployeeSelectionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Badge, Alert, Form, Tab, Tabs } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../../model/scheduleSlice'; // Импортируем наш thunk
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import './EmployeeSelectionModal.css';


const EmployeeSelectionModal = ({ show, onHide, selectedPosition, onEmployeeSelect, scheduleDetails }) => {
    const { t } = useI18n();    const dispatch = useDispatch();

    // Получаем данные из Redux store
    const { recommendations, recommendationsLoading, error } = useSelector(state => state.schedule);

    // Локальное состояние для UI
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('available');
    const getModalTitle = () => {
        if (!selectedPosition) return t('employee.selectEmployee');
        const date = new Date(selectedPosition.date).toLocaleDateString();
        const shift = scheduleDetails?.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails?.positions?.find(p => p.pos_id === selectedPosition.positionId);
        return `${t('employee.selectEmployee')} - ${position?.pos_name} (${shift?.shift_name}, ${date})`;
    };
    // Эффект для загрузки данных при открытии модального окна
    useEffect(() => {
        if (show && selectedPosition && scheduleDetails?.schedule?.id) {
            dispatch(fetchRecommendations({
                positionId: selectedPosition.positionId,
                shiftId: selectedPosition.shiftId,
                date: selectedPosition.date,
                scheduleId: scheduleDetails.schedule.id,
            })).then(action => {
                // После успешной загрузки, автоматически переключаем вкладку, если нет доступных сотрудников
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
    }, [show, selectedPosition, scheduleDetails, dispatch]);


    const filterEmployees = (employees) => {
        if (!searchTerm) return employees;
        return employees.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };


    // --- ЛОГИКА РЕНДЕРИНГА ОСТАЕТСЯ ПОЛНОСТЬЮ БЕЗ ИЗМЕНЕНИЙ ---
    const renderEmployeeList = (employees, type) => {
        const filtered = filterEmployees(employees);

        if (filtered.length === 0) {
            return (
                <Alert variant="info" className="mt-3">
                    <i className="bi bi-info-circle me-2"></i>
                    {searchTerm
                        ? t('employee.noMatchingEmployees')
                        : t('employee.noEmployeesInCategory')}
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

                                    {/* Work site info */}
                                    <div className="employee-site">
                                        <i className="bi bi-building me-1"></i>
                                        {employee.work_site_name || t('employee.noWorkSite')}
                                    </div>

                                    {/* Position info */}
                                    <div className="employee-position">
                                        <i className="bi bi-person-badge me-1"></i>
                                        {employee.default_position_name || t('employee.flexiblePosition')}
                                    </div>

                                    {/* Recommendations */}
                                    {employee.recommendation?.reasons?.map((reason, idx) => (
                                        <small key={idx} className="d-block text-success">
                                            <i className="bi bi-check-circle me-1"></i>
                                            {t(`recommendation.${reason}`, { defaultValue: reason })}
                                        </small>
                                    ))}

                                    {/* Warnings with hours */}
                                    {employee.recommendation?.warnings?.map((warning, idx) => {
                                        // Extract hours from warning if present
                                        const hoursMatch = warning.match(/(\d+)h/);
                                        const hours = hoursMatch ? hoursMatch[1] : null;

                                        return (
                                            <small key={idx} className="d-block text-danger">
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {warning.includes('weekly workload') && hours
                                                    ? t('recommendation.weeklyHours', { hours })
                                                    : t(`recommendation.${warning}`, { defaultValue: warning })}
                                            </small>
                                        );
                                    })}
                                </div>

                                <div className="employee-badges">
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
                                    {employee.recommendation?.score && (
                                        <small className="score-badge">
                                            {t('employee.score')}: {employee.recommendation.score}
                                        </small>
                                    )}
                                </div>
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

    return (
        <Modal show={show} onHide={onHide} size="lg" className="employee-selection-modal">
            <Modal.Header closeButton>
                <Modal.Title>{getModalTitle()}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
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
                    <LoadingState message={t('common.loading')} />
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
                                    {t('employee.tabs.available')}
                                    <Badge bg="secondary" pill className="ms-2">
                                        {recommendations?.available?.length || 0}
                                    </Badge>
                                </span>
                            }
                        >
                            {renderEmployeeList(recommendations?.available || [], 'available')}
                        </Tab>

                        <Tab
                            eventKey="cross_position"
                            title={
                                <span>
                                    {t('employee.tabs.crossPosition')}
                                    <Badge bg="secondary" pill className="ms-2">
                                        {recommendations?.cross_position?.length || 0}
                                    </Badge>
                                </span>
                            }
                        >
                            {renderEmployeeList(recommendations?.cross_position || [], 'cross_position')}
                        </Tab>

                        <Tab
                            eventKey="other_site"
                            title={
                                <span>
                                    {t('employee.tabs.otherSite')}
                                    <Badge bg="secondary" pill className="ms-2">
                                        {recommendations?.other_site?.length || 0}
                                    </Badge>
                                </span>
                            }
                        >
                            {renderEmployeeList(recommendations?.other_site || [], 'other_site')}
                        </Tab>

                        <Tab
                            eventKey="unavailable"
                            title={
                                <span>
                                    {t('employee.tabs.unavailable')}
                                    <Badge bg="secondary" pill className="ms-2">
                                        {(recommendations?.unavailable_soft?.length || 0) +
                                            (recommendations?.unavailable_hard?.length || 0) +
                                            (recommendations?.unavailable_busy?.length || 0)}
                                    </Badge>
                                </span>
                            }
                        >
                            <div className="unavailable-groups">
                                {/* Prefer Different Time - первая группа */}
                                {recommendations?.unavailable_soft?.length > 0 && (
                                    <div className="unavailable-group">
                                        <h6 className="group-title">
                                            {t('employee.preferDifferentTime')}
                                        </h6>
                                        {renderEmployeeList(recommendations.unavailable_soft, 'unavailable_soft')}
                                    </div>
                                )}

                                {/* Cannot Work - вторая группа */}
                                {recommendations?.unavailable_hard?.length > 0 && (
                                    <div className="unavailable-group">
                                        <h6 className="group-title">
                                            {t('employee.cannotWork')}
                                        </h6>
                                        {renderEmployeeList(recommendations.unavailable_hard, 'unavailable_hard')}
                                    </div>
                                )}

                                {/* Already Working - последняя группа */}
                                {recommendations?.unavailable_busy?.length > 0 && (
                                    <div className="unavailable-group muted">
                                        <h6 className="group-title">
                                            {t('employee.alreadyWorking')}
                                        </h6>
                                        {renderEmployeeList(recommendations.unavailable_busy, 'unavailable_busy')}
                                    </div>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('common.cancel')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeSelectionModal;