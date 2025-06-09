// frontend/src/components/admin/schedule/EmployeeSelectionModal.js
import React from 'react';
import { Modal, Button, Spinner, Badge } from 'react-bootstrap';
import { MESSAGES } from '../../../i18n/messages';

const EmployeeSelectionModal = ({
                                    show,
                                    onHide,
                                    recommendations,
                                    loading,
                                    selectedCell,
                                    onEmployeeSelect
                                }) => {
    if (!selectedCell) return null;

    const handleEmployeeSelect = (empId, empName) => {
        onEmployeeSelect(empId, empName);
        onHide();
    };

    const renderEmployeeSection = (title, employees, variant, buttonVariant, showOverride = false) => {
        if (!employees || employees.length === 0) return null;

        return (
            <>
                <h6 className={`text-${variant}`}>
                    {title} ({employees.length})
                </h6>
                <div className="mb-4 employee-list">
                    {employees.map(emp => (
                        <div key={emp.emp_id} className="employee-item">
                            <div>
                                <strong>{emp.first_name} {emp.last_name}</strong>
                                <br/>
                                <small className="text-muted">ID: {emp.emp_id}</small>
                                {emp.constraint_reason && (
                                    <>
                                        <br/>
                                        <small className="text-warning">{emp.constraint_reason}</small>
                                    </>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant={buttonVariant}
                                onClick={() => handleEmployeeSelect(emp.emp_id, `${emp.first_name} ${emp.last_name}`)}
                                disabled={!showOverride && variant === 'danger'}
                            >
                                {showOverride ? 'Override' : MESSAGES.SELECT}
                            </Button>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-person-plus me-2"></i>
                    Select Employee
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                        <div className="mt-2">Loading recommendations...</div>
                    </div>
                ) : recommendations ? (
                    <div>
                        {/* Cell Information */}
                        <div className="mb-4 p-3 bg-light rounded">
                            <h6 className="mb-2">
                                <i className="bi bi-info-circle me-2"></i>
                                Assignment Details
                            </h6>
                            <div className="row">
                                <div className="col-sm-4"><strong>Position:</strong></div>
                                <div className="col-sm-8">{selectedCell.positionName || 'Position'}</div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4"><strong>Date:</strong></div>
                                <div className="col-sm-8">{new Date(selectedCell.date).toLocaleDateString()}</div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4"><strong>Shift:</strong></div>
                                <div className="col-sm-8">{selectedCell.shiftName || 'Shift'}</div>
                            </div>
                        </div>

                        {/* Available Employees */}
                        {renderEmployeeSection(
                            MESSAGES.AVAILABLE,
                            recommendations.recommendations.available,
                            'success',
                            'outline-primary'
                        )}

                        {/* Preferred Employees */}
                        {renderEmployeeSection(
                            MESSAGES.PREFERRED,
                            recommendations.recommendations.preferred,
                            'primary',
                            'primary'
                        )}

                        {/* Cannot Work */}
                        {renderEmployeeSection(
                            MESSAGES.CANNOT_WORK,
                            recommendations.recommendations.cannot_work,
                            'danger',
                            'outline-danger'
                        )}

                        {/* Violates Constraints */}
                        {renderEmployeeSection(
                            MESSAGES.VIOLATES_CONSTRAINTS,
                            recommendations.recommendations.violates_constraints,
                            'warning',
                            'outline-warning',
                            true
                        )}

                        {/* No recommendations */}
                        {(!recommendations.recommendations.available?.length &&
                            !recommendations.recommendations.preferred?.length &&
                            !recommendations.recommendations.cannot_work?.length &&
                            !recommendations.recommendations.violates_constraints?.length) && (
                            <div className="text-center py-4">
                                <i className="bi bi-person-x display-4 text-muted"></i>
                                <h5 className="mt-3">{MESSAGES.NO_RECOMMENDATIONS_AVAILABLE}</h5>
                                <p className="text-muted">No employees found for this assignment.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <div>{MESSAGES.NO_RECOMMENDATIONS_AVAILABLE}</div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {MESSAGES.CANCEL}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeSelectionModal;