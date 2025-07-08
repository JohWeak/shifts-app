import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Container, Spinner, Button} from 'react-bootstrap';

// Widgets, UI, etc.
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import ScheduleList from './ui/schedule-list/ScheduleList';
import ScheduleDetails from './ui/schedule-table/ScheduleDetails';
import GenerateScheduleModal from './ui/modals/GenerateScheduleModal';
import CompareAlgorithmsModal from './ui/modals/CompareAlgorithmsModal';
import EmployeeSelectionModal from './ui/modals/EmployeeSelectionModal';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useScheduleActions } from './model/hooks/useScheduleActions';
import { addNotification } from 'app/model/notificationsSlice';
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
    const { t } = useI18n();
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

    // --- Локальное состояние для UI, которое было утеряно ---
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);

    // --- Эффекты ---
    useEffect(() => {
        dispatch(fetchSchedules());
    }, [dispatch]);

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
        dispatch(setActiveTab(newTab));
    };

    const handleCompareAlgorithms = async () => {
        const result = await dispatch(compareAlgorithms()).unwrap();
        setComparisonResults(result);
        setShowComparisonModal(true);
    };

    const handleCellClick = (date, positionId, shiftId, employeeIdToReplace = null, assignmentIdToReplace = null) => {
        setSelectedCell({
            date: date,
            positionId: positionId,
            shiftId: shiftId,
            employeeIdToReplace: employeeIdToReplace,
            assignmentIdToReplace: assignmentIdToReplace  // Добавляем assignment ID
        });
        setShowEmployeeModal(true);
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
                    assignmentId: selectedCell.assignmentIdToReplace  // Используем сохраненный assignment ID
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

        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    const onScheduleDeleted = (deletedId) => {
        dispatch(addNotification({
            message: t('schedule.deleteSuccess'),
            variant: 'success'
        }));
        if (selectedScheduleId === deletedId) {
            dispatch(setSelectedScheduleId(null));
        }

    };

    // --- Рендеринг ---
    const isLoading = dataLoading === 'pending' || actionsLoading;
    const scheduleExists = !!selectedScheduleId;

    return (
            <Container fluid className="p-2">
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
                            <Spinner size="sm" className="me-2" />
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
                                <Spinner animation="border" />
                            </div>
                        ) : (
                            <ScheduleDetails onCellClick={handleCellClick} />
                        )}
                    </>
                ) : (
                    /* Список расписаний */
                    dataLoading === 'pending' ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <ScheduleList
                            schedules={schedules}
                            onViewDetails={handleViewDetails}
                            onScheduleDeleted={onScheduleDeleted}
                        />
                    )
                )}

                <GenerateScheduleModal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} onGenerate={onGenerateSubmit} generating={actionsLoading} />
                <CompareAlgorithmsModal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} results={comparisonResults} onUseAlgorithm={() => {}} />
                <EmployeeSelectionModal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} selectedPosition={selectedCell} onEmployeeSelect={handleEmployeeSelect} scheduleDetails={scheduleDetails} />
            </Container>
    );
};

export default ScheduleManagement;