// frontend/src/features/schedule-management/ScheduleManagement.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Spinner, Alert } from 'react-bootstrap';

// Widgets, UI, etc.
import AdminLayout from '../../widgets/AdminLayout/AdminLayout';
import ScheduleOverviewTable from './components/ScheduleOverviewTable';
import ScheduleDetailsView from './components/ScheduleDetailsView';
import GenerateScheduleModal from './components/GenerateScheduleModal';
import CompareAlgorithmsModal from './components/CompareAlgorithmsModal';
import EmployeeSelectionModal from './components/EmployeeSelectionModal';
import ScheduleHeader from './components/ScheduleHeader';
import ScheduleTabs from './components/ScheduleTabs';
import { useI18n } from '../../shared/lib/i18n/i18nProvider';

// Redux Actions
import {
    fetchSchedules,
    fetchScheduleDetails,
    compareAlgorithms,
    setActiveTab,
    addPendingChange,
    setSelectedScheduleId,
} from '../../app/store/slices/scheduleSlice';
import { useScheduleActions } from './hooks/useScheduleActions';

// Utils
import './ScheduleManagement.css';

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
            <Container fluid className="p-4">
                <ScheduleHeader
                    onGenerateClick={() => setShowGenerateModal(true)}
                    onCompareClick={handleCompareAlgorithms}
                    loading={isLoading}
                />

                {/* Alert messages */}
                {alert && (
                    <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3">
                        {alert.message}
                    </Alert>
                )}

                {/* Main content */}
                <ScheduleTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    isDetailsDisabled={!scheduleExists}
                    onBackClick={handleBackToList}
                >
                    {{
                        overview: dataLoading === 'pending' ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <ScheduleOverviewTable
                                schedules={schedules}
                                onViewDetails={handleViewDetails}
                                onScheduleDeleted={onScheduleDeleted}
                            />
                        ),
                        details: dataLoading === 'pending' ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <ScheduleDetailsView onCellClick={handleCellClick} />
                        )
                    }}
                </ScheduleTabs>

                <GenerateScheduleModal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} onGenerate={onGenerateSubmit} generating={actionsLoading} />
                <CompareAlgorithmsModal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} results={comparisonResults} onUseAlgorithm={() => {}} />
                <EmployeeSelectionModal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} selectedPosition={selectedCell} onEmployeeSelect={handleEmployeeSelect} scheduleDetails={scheduleDetails} />
            </Container>
        </AdminLayout>
    );
};

export default ScheduleManagement;