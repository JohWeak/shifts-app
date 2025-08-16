import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Button } from 'react-bootstrap';
import { nanoid } from '@reduxjs/toolkit';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

// UI Components
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import GenerateScheduleForm from './ui/GenerateScheduleForm';
import EmployeeRecommendationsModal from './ui/EmployeeRecommendations/EmployeeRecommendationsModal/EmployeeRecommendationsModal';
import EmployeeRecommendationsPanel from './ui/EmployeeRecommendations/EmployeeRecommendationsPanel/EmployeeRecommendationsPanel';
import ScheduleContent from './ui/ScheduleContent';

// Hooks & Actions
import { useScheduleActions } from './model/hooks/useScheduleActions';
import { useScheduleUI } from './model/hooks/useScheduleUI';
import { addNotification } from 'app/model/notificationsSlice';
import {
    fetchSchedules,
    fetchScheduleDetails,
    setSelectedScheduleId,
    fetchWorkSites,
    addPendingChange
} from './model/scheduleSlice';

import './index.css';

const ScheduleManagement = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    // --- DATA SELECTORS ---
    const { selectedScheduleId, scheduleDetails, workSites, workSitesLoading } = useSelector((state) => state.schedule);

    // --- CUSTOM HOOKS FOR LOGIC & STATE ---
    const { loading: actionsLoading, handleGenerate } = useScheduleActions();
    const { selectedCell, isPanelOpen, showEmployeeModal, isLargeScreen, handleCellClick, closeAllModals } = useScheduleUI();

    // --- LOCAL UI STATE ---
    const [isGenerateFormVisible, setIsGenerateFormVisible] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        dispatch(fetchSchedules());
        dispatch(fetchWorkSites());
    }, [dispatch]);

    // --- HANDLERS ---
    const onGenerateSubmit = async (settings) => {
        const notificationId = nanoid();
        dispatch(addNotification({ id: notificationId, type: 'info', message: t('schedule.generatingSchedule'), persistent: true }));

        const result = await handleGenerate(settings);

        if (result.success) {
            setIsGenerateFormVisible(false);
            dispatch(addNotification({ id: notificationId, type: 'success', message: t('schedule.generateSuccess') }));
        } else {
            dispatch(addNotification({ id: notificationId, type: 'error', message: result.error || t('errors.generateFailed') }));
        }
    };

    const handleViewDetails = (scheduleId) => {
        dispatch(setSelectedScheduleId(scheduleId));
        if (scheduleId) {
            dispatch(fetchScheduleDetails(scheduleId));
        }
    };

    const handleEmployeeSelect = (employee) => {
        if (!selectedCell) return;
        const targetPosition = scheduleDetails.positions.find(p => p.pos_id === selectedCell.positionId);
        const isCrossPosition = employee.default_position_id && employee.default_position_id !== selectedCell.positionId;
        const isCrossSite = employee.work_site_id && targetPosition?.work_site_id && employee.work_site_id !== targetPosition.work_site_id;
        const isFlexible = !employee.default_position_id;

        if (selectedCell.employeeIdToReplace) {
            const removeKey = `remove-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${selectedCell.employeeIdToReplace}`;
            dispatch(addPendingChange({ key: removeKey, change: { action: 'remove', ...selectedCell } }));
        }

        const assignKey = `assign-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${employee.emp_id}`;
        dispatch(addPendingChange({
            key: assignKey,
            change: {
                action: 'assign',
                positionId: selectedCell.positionId,
                date: selectedCell.date,
                shiftId: selectedCell.shiftId,
                empId: employee.emp_id,
                empName: `${employee.first_name} ${employee.last_name}`,
                isCrossPosition, isCrossSite, isFlexible
            }
        }));

        if (!isLargeScreen) {
            closeAllModals();
        }
    };

    const onScheduleDeleted = (deletedId) => {
        dispatch(addNotification({ message: t('schedule.deleteSuccess'), variant: 'success' }));
        if (selectedScheduleId === deletedId) {
            dispatch(setSelectedScheduleId(null));
            closeAllModals();
        }
    };

    return (
        <div className={`schedule-management-wrapper ${isPanelOpen && isLargeScreen ? 'panel-open' : ''}`}>
            <div className="schedule-management-content">
                <Container fluid className="p-1 admin-schedule-management-container">
                    <PageHeader icon="calendar-week" title={t('schedule.title')} subtitle={t('schedule.subtitle')}>
                        <Button variant="primary" onClick={() => setIsGenerateFormVisible(!isGenerateFormVisible)} disabled={actionsLoading}>
                            <i className={`bi ${isGenerateFormVisible ? 'bi-chevron-up' : 'bi-plus-circle'} me-2`}></i>
                            <span>{t('schedule.generateSchedule')}</span>
                        </Button>
                    </PageHeader>

                    <div className={`generate-schedule-form-container ${isGenerateFormVisible ? 'visible' : ''}`}>
                        {isGenerateFormVisible && (
                            <GenerateScheduleForm
                                onGenerate={onGenerateSubmit}
                                onCancel={() => setIsGenerateFormVisible(false)}
                                generating={actionsLoading}
                                workSites={workSites}
                                workSitesLoading={workSitesLoading === 'pending'}
                            />
                        )}
                    </div>

                    <ScheduleContent
                        onCellClick={handleCellClick}
                        onScheduleDeleted={onScheduleDeleted}
                        handleViewDetails={handleViewDetails}
                    />
                </Container>
            </div>

            {isLargeScreen ? (
                <EmployeeRecommendationsPanel
                    isOpen={isPanelOpen}
                    onClose={closeAllModals}
                    selectedPosition={selectedCell}
                    onEmployeeSelect={handleEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                />
            ) : (
                <EmployeeRecommendationsModal
                    show={showEmployeeModal}
                    onHide={closeAllModals}
                    selectedPosition={selectedCell}
                    onEmployeeSelect={handleEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                />
            )}
        </div>
    );
};

export default ScheduleManagement;