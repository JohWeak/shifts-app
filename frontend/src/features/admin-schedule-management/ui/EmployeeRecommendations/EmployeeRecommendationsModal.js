// frontend/src/features/admin-schedule-management/ui/EmployeeRecommendations/EmployeeRecommendationsModal.js
import React from 'react';
import {Modal, Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import EmployeeRecommendations from './index';
import './EmployeeRecommendationsModal.css';

const EmployeeRecommendationsModal = ({show, onHide, selectedPosition, onEmployeeSelect, scheduleDetails}) => {
    const {t} = useI18n();

    const getModalTitle = () => {
        if (!selectedPosition) return t('employee.selectEmployee');
        const date = new Date(selectedPosition.date).toLocaleDateString();
        const shift = scheduleDetails?.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails?.positions?.find(p => p.pos_id === selectedPosition.positionId);
        return `${t('employee.selectEmployee')} - ${position?.pos_name} (${shift?.shift_name}, ${date})`;
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            className="employee-selection-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>{getModalTitle()}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <EmployeeRecommendations
                    selectedPosition={selectedPosition}
                    onEmployeeSelect={onEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                    isVisible={show}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('common.cancel')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EmployeeRecommendationsModal;