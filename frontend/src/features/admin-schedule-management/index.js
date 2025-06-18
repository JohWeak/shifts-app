// frontend/src/features/admin-schedule-management/weeklySchedule.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Container, Spinner, Alert, Button} from 'react-bootstrap';

// Widgets, UI, etc.
import AdminLayout from '../../shared/ui/layouts/AdminLayout/AdminLayout';
import PageHeader from '../../shared/ui/components/PageHeader/PageHeader';
import ScheduleList from './ui/schedule-list/ScheduleList';
import ScheduleDetails from './ui/schedule-table/ScheduleDetails';
import GenerateScheduleModal from './ui/modals/GenerateScheduleModal';
import CompareAlgorithmsModal from './ui/modals/CompareAlgorithmsModal';
import EmployeeSelectionModal from './ui/modals/EmployeeSelectionModal';
import { useI18n } from '../../shared/lib/i18n/i18nProvider';
import { useScheduleActions } from './model/hooks/useScheduleActions';
import './index.css';

// Redux Actions
import {
    fetchSchedules,
    fetchScheduleDetails,
    compareAlgorithms,
    setActiveTab,
    addPendingChange,
    setSelectedScheduleId,
} from '../../app/store/slices/scheduleSlice';



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
    const [alert, setAlert] = useState(null);
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
            setAlert({ type: 'success', message: t('schedule.generateSuccess') });
            setShowGenerateModal(false);


            dispatch(fetchSchedules());
        } else {
            setAlert({ type: 'danger', message: actionError || t('schedule.generateError') });
        }
    };

    const handleViewDetails = async (scheduleId) => {
        dispatch(setSelectedScheduleId(scheduleId));
        if (scheduleId) {
            dispatch(fetchScheduleDetails(scheduleId));
        }
    };

    const handleBackToList = () => {
        dispatch(setActiveTab('overview'));
        dispatch(setSelectedScheduleId(null));
    };

    const handleTabChange = (newTab) => {
        dispatch(setActiveTab(newTab));
    };

    const handleCompareAlgorithms = async () => {
        const result = await dispatch(compareAlgorithms()).unwrap();
        setComparisonResults(result);
        setShowComparisonModal(true);
    };

    const handleCellClick = (cell) => {
        setSelectedCell(cell);
        setShowEmployeeModal(true);
    };

    const handleEmployeeSelect = async (employeeId) => {
        if (!selectedCell) return;

        dispatch(addPendingChange({
            positionId: selectedCell.positionId,
            dayIndex: selectedCell.dayIndex,
            shiftId: selectedCell.shiftId,
            employeeId: employeeId,
        }));

        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    const onScheduleDeleted = (deletedId) => {
        setAlert({ type: 'success', message: t('schedule.deleteSuccess') });
        if (selectedScheduleId === deletedId) {
            dispatch(setSelectedScheduleId(null));
        }
    };

    // --- Рендеринг ---
    const isLoading = dataLoading === 'pending' || actionsLoading;
    const scheduleExists = !!selectedScheduleId;

    return (
        <AdminLayout>
            <Container fluid className="px-0">
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

                {/* Alert messages */}
                {alert && (
                    <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3">
                        {alert.message}
                    </Alert>
                )}

                {/* Main content */}
                {activeTab === 'view' && selectedScheduleId ? (
                    <>
                        {/* Кнопка "Назад" */}
                        <div className="d-flex align-items-center mb-3">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleBackToList}
                                className="me-3"
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                {t('common.back')}
                            </Button>
                        </div>

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
        </AdminLayout>
    );
};

export default ScheduleManagement;