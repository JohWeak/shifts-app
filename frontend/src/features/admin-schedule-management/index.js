// frontend/src/features/admin-schedule-management/index.js

import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Button, Container} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';

// UI Components
import PageHeader from 'shared/ui/components/PageHeader';
import GenerateScheduleForm from './ui/GenerateScheduleForm';
import ScheduleContent from './ui/ScheduleContent';

// Hooks & Actions
import {useScheduleActions} from './model/hooks/useScheduleActions';
import {useScheduleUI} from './model/hooks/useScheduleUI';
import {
    addPendingChange,
    fetchScheduleDetails,
    fetchSchedules,
    fetchWorkSites,
    preloadScheduleDetails,
    setSelectedScheduleId,
} from './model/scheduleSlice';

import {fetchPositions} from '../admin-workplace-settings/model/workplaceSlice';
import {fetchSystemSettings} from '../admin-system-settings/model/settingsSlice';
import './index.css';

const ScheduleManagement = () => {
    const {t, direction} = useI18n();
    const dispatch = useDispatch();

    const {
        selectedScheduleId,
        scheduleDetails,
        schedules,
        workSites,
        workSitesLoading,
    } = useSelector((state) => state.schedule);

    const {loading: actionsLoading, handleGenerate} = useScheduleActions();
    const {
        selectedCell,
        isPanelOpen,
        showEmployeeModal,
        isLargeScreen,
        handleCellClick,
        closeAllModals,
    } = useScheduleUI();
    const [isGenerateFormVisible, setIsGenerateFormVisible] = useState(false);
    const [panelWidth, setPanelWidth] = useState(() =>
        parseInt(localStorage.getItem('recommendationPanelWidth')) || 25,
    );
    const handlePanelWidthChange = (newWidth) => {
        setPanelWidth(newWidth);
        localStorage.setItem('recommendationPanelWidth', newWidth.toString());
    };

    useEffect(() => {
        dispatch(fetchSchedules());
        dispatch(fetchWorkSites());
        dispatch(fetchPositions());
        dispatch(fetchSystemSettings());
    }, [dispatch]);

    useEffect(() => {
        if (schedules && schedules.length > 0) {
            dispatch(preloadScheduleDetails());
        }
    }, [schedules, dispatch]);

    const handleViewDetails = (scheduleId) => {
        dispatch(setSelectedScheduleId(scheduleId));
        if (scheduleId) dispatch(fetchScheduleDetails(scheduleId));
    };

    const handleEmployeeSelect = (employee) => {
        if (!selectedCell) return;
        const targetPosition = scheduleDetails.positions.find(p => p.pos_id === selectedCell.positionId);
        const targetSite = scheduleDetails.schedule.work_site;
        const isCrossPosition = employee.default_position_id && employee.default_position_id !== selectedCell.positionId;
        const isCrossSite = employee.work_site_id && targetSite?.site_id && employee.work_site_id !== targetSite.site_id;
        const isFlexible = !employee.default_position_id || !employee.work_site_id;
        console.log('[Target Position]', targetPosition);

        if (selectedCell.employeeIdToReplace) {
            const removeKey = `remove-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${selectedCell.employeeIdToReplace}`;
            dispatch(addPendingChange({
                key: removeKey,
                change: {
                    action: 'remove',
                    positionId: selectedCell.positionId,
                    date: selectedCell.date,
                    shiftId: selectedCell.shiftId,
                    empId: selectedCell.employeeIdToReplace,
                    assignmentId: selectedCell.assignmentIdToReplace,
                },
            }));
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
                isCrossPosition,
                isCrossSite,
                isFlexible,
            },
        }));
        if (!isLargeScreen) closeAllModals();
    };

    const onScheduleDeleted = (deletedId) => {
        if (selectedScheduleId === deletedId) {
            dispatch(setSelectedScheduleId(null));
            closeAllModals();
        }
    };

    const onGenerateSubmit = async (settings) => {
        const result = await handleGenerate(settings);
        if (result.success) {
            setIsGenerateFormVisible(false);
        }
    };

    const GAP_VALUE = '1rem';
    const contentStyles = {
        marginRight: isPanelOpen && isLargeScreen
            ? `calc(${panelWidth}% + ${GAP_VALUE})`
            : '0',
    };

    if (direction === 'rtl') {
        contentStyles.marginLeft = isPanelOpen && isLargeScreen
            ? `calc(${panelWidth}% + ${GAP_VALUE})`
            : '0';
        delete contentStyles.marginRight;
    }

    return (
        <div className="schedule-management-wrapper">
            <div className="schedule-management-content"
                 style={contentStyles}
            >
                <Container fluid className="p-1 admin-schedule-management-container">
                    <PageHeader icon="calendar-week" title={t('schedule.title')} subtitle={t('schedule.subtitle')}>
                        <Button
                            variant={`${isGenerateFormVisible ? 'outline-primary' : 'primary'}`}
                            onClick={() => setIsGenerateFormVisible(!isGenerateFormVisible)}
                            disabled={actionsLoading}
                        >
                            <i className={`bi ${isGenerateFormVisible ? 'bi-chevron-up' : 'bi-gear'} me-2`}></i>
                            <span>{t('schedule.generateSchedule')}</span>
                        </Button>
                    </PageHeader>


                    <div className={`generate-schedule-form-container ${isGenerateFormVisible ? 'visible' : ''}`}>
                        <GenerateScheduleForm
                            onGenerate={onGenerateSubmit}
                            onCancel={() => setIsGenerateFormVisible(false)}
                            generating={actionsLoading}
                            workSites={workSites}
                            workSitesLoading={workSitesLoading === 'pending'}
                        />
                    </div>


                    <ScheduleContent
                        handleViewDetails={handleViewDetails}
                        onScheduleDeleted={onScheduleDeleted}
                        onCellClick={handleCellClick}
                        onEmployeeSelect={handleEmployeeSelect}
                        selectedCell={selectedCell}
                        isPanelOpen={isPanelOpen}
                        showEmployeeModal={showEmployeeModal}
                        isLargeScreen={isLargeScreen}
                        closeAllModals={closeAllModals}
                        panelWidth={panelWidth}
                        onPanelWidthChange={handlePanelWidthChange}
                    />
                </Container>
            </div>
        </div>
    );
};

export default ScheduleManagement;