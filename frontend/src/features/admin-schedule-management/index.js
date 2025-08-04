import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container, Spinner, Button} from 'react-bootstrap';

// Widgets, UI, etc.
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import ScheduleList from './ui/schedule-list/ScheduleList';
import ScheduleDetails from './ui/schedule-table/ScheduleDetails';
import GenerateScheduleModal from './ui/modals/GenerateScheduleModal';
import CompareAlgorithmsModal from './ui/modals/CompareAlgorithmsModal';
import EmployeeRecommendationModal from './ui/modals/EmployeeRecommendationModal';
import EmployeeRecommendationPanel from './ui/panels/EmployeeRecommendationPanel';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
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
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1500);


    // --- Эффекты ---
    useEffect(() => {
        dispatch(fetchSchedules());
    }, [dispatch]);

    // Track screen size for panel/modal decision
    useEffect(() => {
        const handleResize = () => {
            const newIsLarge = window.innerWidth >= 1500;
            setIsLargeScreen(newIsLarge);

            // If switching from large to small screen while panel is open, close it and open modal
            if (!newIsLarge && isPanelOpen) {
                setIsPanelOpen(false);
                setShowEmployeeModal(true);
            }
            // If switching from small to large screen while modal is open, close it and open panel
            else if (newIsLarge && showEmployeeModal) {
                setShowEmployeeModal(false);
                setIsPanelOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPanelOpen, showEmployeeModal]);

    // Close panel when saving schedule
    useEffect(() => {
        // Listen for save completion (you might need to add this to your redux state)
        //if (dataLoading === 'succeeded' && isPanelOpen) {
            // Optionally close panel after successful save
            //setIsPanelOpen(false);
        //}
    }, [dataLoading, isPanelOpen]);

    useEffect(() => {
        console.log('scheduleDetails changed, keys:', scheduleDetails ? Object.keys(scheduleDetails) : 'null');
    }, [scheduleDetails]);
    useEffect(() => {
        console.log('Panel state:', {
            isPanelOpen,
            isLargeScreen,
            selectedCell,
            showEmployeeModal
        });
    }, [isPanelOpen, isLargeScreen, selectedCell, showEmployeeModal]);


    // --- Обработчики действий ---
    const onGenerateSubmit = async (settings) => {
        const result = await handleGenerate(settings);

        if (result.success) {
            dispatch(addNotification({
                message: t('schedule.generateSuccess'),
                variant: 'success'
            }));
            setShowGenerateModal(false);

            dispatch(fetchSchedules());
        } else {
            dispatch(addNotification({
                message: actionError || t('schedule.generateError'),
                variant: 'danger',
                duration: 5000
            }));
        }
    };

    const handleViewDetails = async (scheduleId) => {
        dispatch(setSelectedScheduleId(scheduleId));
        if (scheduleId) {
            dispatch(fetchScheduleDetails(scheduleId));
        }
    };

    const handleTabChange = (newTab) => {
        console.log('handleTabChange:', newTab);
        dispatch(setActiveTab(newTab));
        // Close panel when switching tabs
        if (newTab !== 'view') {
            console.log('Closing panel due to tab change');
            setIsPanelOpen(false);
        }
    };


    const handleCellClick = (date, positionId, shiftId, employeeIdToReplace = null, assignmentIdToReplace = null) => {

        console.log('Cell clicked:', { date, positionId, shiftId });

        const cell = {
            date: date,
            positionId: positionId,
            shiftId: shiftId,
            employeeIdToReplace: employeeIdToReplace,
            assignmentIdToReplace: assignmentIdToReplace
        };

        setSelectedCell(cell);

        // Open panel on large screens, modal on small screens
        if (isLargeScreen) {
            console.log('Opening panel');
            setIsPanelOpen(true);
            setShowEmployeeModal(false);
        } else {
            console.log('Opening modal');
            setShowEmployeeModal(true);
            setIsPanelOpen(false);
        }
    };

    const handleEmployeeSelect = async (employeeId, employeeName) => {
        if (!selectedCell) return;

        const key = selectedCell.employeeIdToReplace
            ? `replace-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${selectedCell.employeeIdToReplace}`
            : `assign-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${employeeId}`;

        // Если это замена, сначала удаляем старого сотрудника
        if (selectedCell.employeeIdToReplace) {
            dispatch(addPendingChange({
                key: `remove-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${selectedCell.employeeIdToReplace}`,
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

        // Затем добавляем нового
        dispatch(addPendingChange({
            key,
            change: {
                action: 'assign',
                positionId: selectedCell.positionId,
                date: selectedCell.date,
                shiftId: selectedCell.shiftId,
                empId: employeeId,
                empName: employeeName
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


    // --- Рендеринг ---
    const isLoading = dataLoading === 'pending' || actionsLoading;
    const scheduleExists = !!selectedScheduleId;

    return (
        <div className={`schedule-management-wrapper ${isPanelOpen && isLargeScreen ? 'panel-open' : ''}`}>
            <div className="schedule-management-content">
                <Container fluid className="p-1 admin-schedule-management-container">
                    <PageHeader
                        icon="calendar-week"
                        title={t('schedule.title')}
                        subtitle={t('schedule.subtitle')}
                    >
                        <Button
                            variant="primary"
                            onClick={() => setShowGenerateModal(true)}
                            disabled={isLoading}
                            className="d-flex align-items-center"
                        >
                            {isLoading ? (
                                <Spinner size="sm" className="me-2"/>
                            ) : (
                                <i className="bi bi-plus-circle me-2"></i>
                            )}
                            <span>{t('schedule.generateSchedule')}</span>
                        </Button>
                    </PageHeader>

                    {/* Main content */}
                    {activeTab === 'view' && selectedScheduleId ? (
                        <>
                            {/* Детали расписания */}
                            {dataLoading === 'pending' ? (
                                <div className="text-center p-5">
                                    <Spinner animation="border"/>
                                </div>
                            ) : (
                                <ScheduleDetails onCellClick={handleCellClick}/>
                            )}
                        </>
                    ) : (
                        /* Список расписаний */
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
                    <GenerateScheduleModal
                        show={showGenerateModal}
                        onHide={() => setShowGenerateModal(false)}
                        onGenerate={onGenerateSubmit}
                        generating={actionsLoading}
                    />

                    <CompareAlgorithmsModal
                        show={showComparisonModal}
                        onHide={() => setShowComparisonModal(false)}
                        results={comparisonResults}
                        onUseAlgorithm={() => {
                        }}
                    />

                    {/* Employee Selection Modal - only for small screens */}
                    {!isLargeScreen && (
                        <EmployeeRecommendationModal
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
                <EmployeeRecommendationPanel
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