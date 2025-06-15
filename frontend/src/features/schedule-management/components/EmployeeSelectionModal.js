// frontend/src/features/schedule-management/components/EmployeeSelectionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Badge, Alert, Form, Tab, Tabs } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../../../app/store/slices/scheduleSlice'; // Импортируем наш thunk
import { useI18n } from '../../../shared/lib/i18n/i18nProvider';
import LoadingState from '../../../shared/ui/LoadingState/LoadingState';

const EmployeeSelectionModal = ({ show, onHide, selectedPosition, onEmployeeSelect, scheduleDetails }) => {
    const { t } = useI18n();    const dispatch = useDispatch();

    // Получаем данные из Redux store
    const { recommendations, recommendationsLoading, error } = useSelector(state => state.schedule);

    // Локальное состояние для UI
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('available');

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

    const handleEmployeeClick = (employee) => {
        onEmployeeSelect(employee.emp_id, `${employee.first_name} ${employee.last_name}`);
    };

    const filterEmployees = (employees) => {
        if (!searchTerm) return employees;
        return employees.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const getModalTitle = () => {
        if (!selectedPosition) return t.selectEmployee;
        const date = new Date(selectedPosition.date).toLocaleDateString();
        const shift = scheduleDetails?.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails?.positions?.find(p => p.pos_id === selectedPosition.positionId);
        return `${t.selectEmployee} - ${position?.pos_name} (${shift?.shift_name}, ${date})`;
    };

    // --- ЛОГИКА РЕНДЕРИНГА ОСТАЕТСЯ ПОЛНОСТЬЮ БЕЗ ИЗМЕНЕНИЙ ---
    const renderEmployeeList = (employees, type) => {
        const filtered = filterEmployees(employees);

        if (filtered.length === 0) {
            return (
                <Alert variant="info" className="mt-3">
                    <i className="bi bi-info-circle me-2"></i>
                    {searchTerm ? 'No employees match your search.' : 'No employees in this category.'}
                </Alert>
            );
        }

        return (
            <ListGroup>
                {filtered.map(employee => {
                    const isAvailable = type === 'available' || type === 'cross_position';
                    const showWarning = !isAvailable;

                    return (
                        <ListGroup.Item
                            key={employee.emp_id}
                            action
                            onClick={() => {
                                if (showWarning) {
                                    const confirmAssign = window.confirm(
                                        `Warning! ${employee.first_name} ${employee.last_name} is marked as unavailable:\n\n` +
                                        `Reason: ${employee.unavailable_reason?.replace('_', ' ') || 'N/A'}\n` +
                                        `${employee.note || ''}\n\n` +
                                        `Are you sure you want to assign them anyway?`
                                    );
                                    if (confirmAssign) handleEmployeeClick(employee);
                                } else {
                                    handleEmployeeClick(employee);
                                }
                            }}
                            className={`d-flex justify-content-between align-items-center ${showWarning ? 'list-group-item-warning' : ''}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <div>
                                <div className="fw-bold">{employee.first_name} {employee.last_name}</div>
                                <small className="text-muted">ID: {employee.emp_id} | Position: {employee.default_position_name || 'N/A'}</small>
                                {employee.recommendation?.reasons?.map((reason, idx) => (
                                    <small key={idx} className="d-block text-success"><i className="bi bi-check-circle me-1"></i>{reason}</small>
                                ))}
                                {employee.recommendation?.warnings?.map((warning, idx) => (
                                    <small key={idx} className="d-block text-danger"><i className="bi bi-exclamation-circle me-1"></i>{warning}</small>
                                ))}
                                {/*{employee.note && (*/}
                                {/*    <small className="d-block text-danger mt-1"><i className="bi bi-exclamation-circle me-1"></i>{employee.note}</small>*/}
                                {/*)}*/}
                            </div>
                            <div className="d-flex flex-column align-items-end">
                                {type === 'available' && <Badge bg="success">Available</Badge>}
                                {type === 'cross_position' && <Badge bg="warning" text="dark">Cross-Position</Badge>}
                                {showWarning && (
                                    <>
                                        <Badge bg="danger">Unavailable</Badge>
                                        <small className="text-danger mt-1"><i className="bi bi-exclamation-triangle"></i> Click to override</small>
                                    </>
                                )}
                                {employee.recommendation?.score && (
                                    <small className="text-muted mt-1">Score: {employee.recommendation.score}</small>
                                )}
                            </div>
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="employee-selection-modal">
            <Modal.Header closeButton>
                <Modal.Title>{getModalTitle()}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Form.Group className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={recommendationsLoading === 'pending'}
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
                    <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3" justify>
                        <Tab eventKey="available" title={<span>Available <Badge bg="secondary" pill>{recommendations?.available?.length || 0}</Badge></span>}>
                            {/* Передаем пустой массив, если recommendations еще не загрузились */}
                            {renderEmployeeList(recommendations?.available || [], 'available')}
                        </Tab>

                        <Tab eventKey="cross_position" title={<span>Cross-Position <Badge bg="secondary" pill>{recommendations?.cross_position?.length || 0}</Badge></span>}>
                            {/* ... */}
                            {renderEmployeeList(recommendations?.cross_position || [], 'cross_position')}
                        </Tab>

                        <Tab eventKey="unavailable" title={<span>Unavailable <Badge bg="secondary" pill>{(recommendations?.unavailable_busy?.length || 0) + (recommendations?.unavailable_hard?.length || 0) + (recommendations?.unavailable_soft?.length || 0)}</Badge></span>}>
                            <div className="mt-3">
                                {/* --- ДОБАВЬТЕ ЭТОТ КОД --- */}
                                {recommendations?.unavailable_busy?.length > 0 && (
                                    <>
                                        <h6 className="text-muted small text-uppercase">Already Working / Rest Violations</h6>
                                        {renderEmployeeList(recommendations.unavailable_busy, 'unavailable_busy')}
                                        <hr />
                                    </>
                                )}
                                {recommendations?.unavailable_hard?.length > 0 && (
                                    <>
                                        <h6 className="text-muted small text-uppercase">Cannot Work (Constraints)</h6>
                                        {renderEmployeeList(recommendations.unavailable_hard, 'unavailable_hard')}
                                        <hr />
                                    </>
                                )}
                                {recommendations?.unavailable_soft?.length > 0 && (
                                    <>
                                        <h6 className="text-muted small text-uppercase">Prefer Different Time</h6>
                                        {renderEmployeeList(recommendations.unavailable_soft, 'unavailable_soft')}
                                    </>
                                )}
                                {/* ------------------------- */}
                            </div>
                        </Tab>
                    </Tabs>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>{t.CANCEL}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeSelectionModal;