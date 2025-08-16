//frontend/src/features/admin-schedule-management/index.js
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container, Spinner, Button} from 'react-bootstrap';

// Widgets, UI, etc.
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import ScheduleList from './ui/schedule-list/ScheduleList';
import ScheduleDetails from './ui/schedule-table/ScheduleDetails';
import CompareAlgorithmsModal from './ui/generate-schedule/CompareAlgorithmsModal';
import GenerateScheduleForm from './ui/generate-schedule/GenerateScheduleForm';
import EmployeeRecommendationsModal from './ui/employee-recommendations/EmployeeRecommendationsModal';
import EmployeeRecommendationsPanel from './ui/employee-recommendations/EmployeeRecommendationsPanel';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import { nanoid } from '@reduxjs/toolkit';
import {useScheduleActions} from './model/hooks/useScheduleActions';
import {addNotification} from 'app/model/notificationsSlice';
import './index.css';

// Redux Actions
import {
    fetchSchedules,
    fetchScheduleDetails,
    compareAlgorithms,
    setActiveTab,
    addPendingChange,
    setSelectedScheduleId,
    fetchWorkSites
} from './model/scheduleSlice';


// --- Основной компонент ---
const ScheduleManagement = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();

    const {
        schedules,
        scheduleDetails,
        loading: dataLoading,
        error: dataError,
        activeTab,
        selectedScheduleId,
        editingPositions,
        workSites,
        workSitesLoading,
        //pendingChanges
    } = useSelector((state) => state.schedule);

    // 2. Инициализируем наш хук для выполнения действий
    const {
        loading: actionsLoading,
        error: actionError,
        handleGenerate,
        handleDelete: performDelete,
    } = useScheduleActions();

    // --- Локальное состояние для UI ---
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [loading, setIsLoading] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isGenerateFormVisible, setIsGenerateFormVisible] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1500);



    useEffect(() => {
        dispatch(fetchSchedules());
        dispatch(fetchWorkSites());
    }, [dispatch]);

    // Track screen size for panel/modal decision
    useEffect(() => {
        const handleResize = () => {
            const newIsLarge = window.innerWidth >= 1500;
            setIsLargeScreen(newIsLarge);

            if (!newIsLarge && isPanelOpen) {
                setIsPanelOpen(false);
                setShowEmployeeModal(true);
            }
            else if (newIsLarge && showEmployeeModal) {
                setShowEmployeeModal(false);
                setIsPanelOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPanelOpen, showEmployeeModal]);

    // Close panel if no editing
    useEffect(() => {
        const editingPositionsCount = Object.values(editingPositions || {}).filter(Boolean).length;
        if (editingPositionsCount === 0 && isPanelOpen) {
            console.log('No positions in edit mode, closing panel');
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [editingPositions, isPanelOpen]);

    useEffect(() => {
        if (activeTab !== 'view' && isPanelOpen) {
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [activeTab, isPanelOpen]);


    useEffect(() => {
        console.log('scheduleDetails changed, keys:', scheduleDetails ? Object.keys(scheduleDetails) : 'null');
    }, [scheduleDetails]);



    const onGenerateSubmit = async (generationSettings) => {
        console.log('Generating schedule with settings:', generationSettings);
        setIsLoading(true);

        const notificationId = nanoid();
        dispatch(addNotification({
            id: notificationId,
            type: 'info',
            message: t('schedule.generatingSchedule'),
            persistent: true
        }));

        try {
            const result = await handleGenerate(generationSettings);

            if (result.success) {
                // Close the modal
                setIsGenerateFormVisible(false);

                // Update notification
                dispatch(addNotification({
                    id: notificationId,
                    type: 'success',
                    message: t('schedule.generateSuccess'),
                    persistent: false
                }));

            } else {
                dispatch(addNotification({
                    id: notificationId,
                    type: 'error',
                    message: result.error || t('errors.generateFailed'),
                    persistent: false
                }));
            }
        } catch (error) {
            console.error('Failed to generate schedule:', error);
            dispatch(addNotification({
                id: notificationId,
                type: 'error',
                message: error.message || t('errors.generateFailed'),
                persistent: false
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = async (scheduleId) => {
        dispatch(setSelectedScheduleId(scheduleId));
        if (scheduleId) {
            dispatch(fetchScheduleDetails(scheduleId));
        }
    };

    const handleCellClick = (date, positionId, shiftId, employeeIdToReplace = null, assignmentIdToReplace = null) => {

        if (!editingPositions || !editingPositions[positionId]) {
            console.log('Position', positionId, 'not in edit mode, ignoring cell click');
            return;
        }

        console.log('Cell clicked in edit mode:', { date, positionId, shiftId, employeeIdToReplace });

        const cell = {
            date: date,
            positionId: positionId,
            shiftId: shiftId,
            employeeIdToReplace: employeeIdToReplace,
            assignmentIdToReplace: assignmentIdToReplace
        };

        setSelectedCell(cell);

        if (isLargeScreen) {
            setIsPanelOpen(true);
            setShowEmployeeModal(false);
        } else {
            setShowEmployeeModal(true);
            setIsPanelOpen(false);
        }
    };

    // Listening for a successful save from redux
    useEffect(() => {
        // The panel will close automatically when editingPositions is empty.
        if (dataLoading === 'succeeded') {
            console.log('Save completed');

        }
    }, [dataLoading]);

    const handleEmployeeSelect = async (employee) => {
        if (!selectedCell) return;
        console.log('handleEmployeeSelect called:', { employee, selectedCell });

        // Get target position details
        const targetPosition = scheduleDetails.positions.find(p => p.pos_id === selectedCell.positionId);

        // Determine if this is cross-position, cross-site, or flexible assignment
        const isCrossPosition = employee.default_position_id &&
            employee.default_position_id !== selectedCell.positionId;
        const isCrossSite = employee.work_site_id &&
            targetPosition?.work_site_id &&
            employee.work_site_id !== targetPosition.work_site_id;
        const isFlexible = !employee.default_position_id;

        // If this is a replacement, we remove the old employee first
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
                    assignmentId: selectedCell.assignmentIdToReplace
                }
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
                isFlexible
            }
        }));

        // Don't close panel on large screens (allow multiple selections)
        // Only close modal on small screens
        if (!isLargeScreen) {
            setShowEmployeeModal(false);
            setSelectedCell(null);
        }
    };

    const onScheduleDeleted = (deletedId) => {
        console.log('onScheduleDeleted:', deletedId);
        dispatch(addNotification({
            message: t('schedule.deleteSuccess'),
            variant: 'success'
        }));
        if (selectedScheduleId === deletedId) {
            dispatch(setSelectedScheduleId(null));
            console.log('Closing panel due to schedule deletion');
            setIsPanelOpen(false);
        }
    };

    const handlePanelClose = () => {
        console.log('handlePanelClose called');
        setIsPanelOpen(false);
        setSelectedCell(null);
    };
    useEffect(() => {
        return () => {
            setIsPanelOpen(false);
            setSelectedCell(null);
        };
    }, []);

    // --- Рендеринг ---
    const isLoading = dataLoading === 'pending' || actionsLoading;

    return (
        <div className={`schedule-management-wrapper ${isPanelOpen && isLargeScreen ? 'panel-open' : ''}`}>
            <div className="schedule-management-content">
                <Container fluid className="p-1 admin-schedule-management-container">
                    <PageHeader
                        icon="calendar-week"
                        title={t('schedule.title')}
                        subtitle={t('schedule.subtitle')}
                    >
                        <Button variant="primary"
                                onClick={() => setIsGenerateFormVisible(!isGenerateFormVisible)}
                                disabled={actionsLoading}>
                            <i className={`bi ${isGenerateFormVisible ? 'bi-chevron-up' : 'bi-plus-circle'} me-2`}></i>
                            <span>{t('schedule.generateSchedule')}</span>
                        </Button>
                    </PageHeader>
                    {/* Animated form container - only visible when the form is open */}
                    <div className={`generate-schedule-form-container ${isGenerateFormVisible ? 'visible' : ''}`}>
                        <GenerateScheduleForm
                            onGenerate={onGenerateSubmit}
                            onCancel={() => setIsGenerateFormVisible(false)}
                            generating={actionsLoading}
                            workSites={workSites}
                            workSitesLoading={workSitesLoading === 'pending'}
                        />
                    </div>
                    {/* Main content */}
                    {activeTab === 'view' && selectedScheduleId ? (
                        <>
                            {/* Schedule details */}
                            {dataLoading === 'pending' ? (
                                <div className="text-center p-5">
                                    <Spinner animation="border"/>
                                </div>
                            ) : (
                                <ScheduleDetails
                                    selectedCell={selectedCell}
                                    onCellClick={handleCellClick}
                                />
                            )}
                        </>
                    ) : (
                        /* Schedule list */
                        dataLoading === 'pending' ? (
                            <div className="text-center p-5">
                                <Spinner animation="border"/>
                            </div>
                        ) : (
                            <ScheduleList
                                schedules={schedules}
                                onViewDetails={handleViewDetails}
                                onScheduleDeleted={onScheduleDeleted}
                            />
                        )
                    )}

                    {/* Modals */}
                    <CompareAlgorithmsModal
                        show={showComparisonModal}
                        onHide={() => setShowComparisonModal(false)}
                        results={comparisonResults}
                        onUseAlgorithm={() => {
                        }}
                    />

                    {/* Employee Selection Modal - only for small screens */}
                    {!isLargeScreen && (
                        <EmployeeRecommendationsModal
                            show={showEmployeeModal}
                            onHide={() => {
                                setShowEmployeeModal(false);
                                setSelectedCell(null);
                            }}
                            selectedPosition={selectedCell}
                            onEmployeeSelect={handleEmployeeSelect}
                            scheduleDetails={scheduleDetails}
                        />
                    )}
                </Container>
            </div>

            {/* Employee Recommendation Panel - only for large screens */}
            {isLargeScreen && (
                <EmployeeRecommendationsPanel
                    isOpen={isPanelOpen}
                    onClose={handlePanelClose}
                    selectedPosition={selectedCell}
                    onEmployeeSelect={handleEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                />
            )}
        </div>
    );
};

export default ScheduleManagement;