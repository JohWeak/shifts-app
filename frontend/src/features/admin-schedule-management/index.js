//frontend/src/features/admin-schedule-management/index.js
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Container, Spinner, Button} from 'react-bootstrap';

// Widgets, UI, etc.
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import ScheduleList from './ui/schedule-list/ScheduleList';
import ScheduleDetails from './ui/schedule-table/ScheduleDetails';
import GenerateScheduleModal from './ui/generate-schedule/GenerateScheduleModal';
import CompareAlgorithmsModal from './ui/generate-schedule/CompareAlgorithmsModal';
import EmployeeRecommendationsModal from './ui/employee-recommendations/EmployeeRecommendationsModal';
import EmployeeRecommendationsPanel from './ui/employee-recommendations/EmployeeRecommendationsPanel';
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

    // Close panel if no editing
    useEffect(() => {
        // Получаем количество позиций в режиме редактирования
        const editingPositionsCount = Object.values(editingPositions || {}).filter(Boolean).length;

        // Если нет позиций в режиме редактирования и панель открыта - закрываем
        if (editingPositionsCount === 0 && isPanelOpen) {
            console.log('No positions in edit mode, closing panel');
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [editingPositions, isPanelOpen]);

    useEffect(() => {
        if (activeTab !== 'view' && isPanelOpen) {
            console.log('Tab changed from view, closing panel');
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [activeTab, isPanelOpen]);


    useEffect(() => {
        console.log('scheduleDetails changed, keys:', scheduleDetails ? Object.keys(scheduleDetails) : 'null');
    }, [scheduleDetails]);



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

    const handleEmployeeSelect = async (employeeId, employeeName) => {
        if (!selectedCell) return;

        const key = selectedCell.employeeIdToReplace
            ? `replace-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${selectedCell.employeeIdToReplace}`
            : `assign-${selectedCell.positionId}-${selectedCell.date}-${selectedCell.shiftId}-${employeeId}`;

        // If this is a replacement, we remove the old employee first.
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

        // Then add a new one
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
    useEffect(() => {
        return () => {
            // При уходе со страницы закрываем панель
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
                            {/* Schedule details */}
                            {dataLoading === 'pending' ? (
                                <div className="text-center p-5">
                                    <Spinner animation="border"/>
                                </div>
                            ) : (
                                <ScheduleDetails
                                    selectedCell={selectedCell}
                                    onCellClick={handleCellClick}/>
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