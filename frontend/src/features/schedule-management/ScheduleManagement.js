// frontend/src/features/schedule-management/ScheduleManagement.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useMessages } from '../../shared/lib/i18n/messages';

// Widgets & UI
import AdminLayout from '../../widgets/AdminLayout/AdminLayout';
import ScheduleOverviewTable from './components/ScheduleOverviewTable';
import ScheduleDetailsView from './components/ScheduleDetailsView';
import GenerateScheduleModal from './components/GenerateScheduleModal';
import CompareAlgorithmsModal from './components/CompareAlgorithmsModal';
import EmployeeSelectionModal from './components/EmployeeSelectionModal';
import AlertMessage from '../../shared/ui/AlertMessage';

// Redux Actions
import {
    fetchSchedules,
    fetchScheduleDetails,
    generateSchedule,
    compareAlgorithms,
    deleteSchedule,
    setActiveTab,
    resetScheduleView,
    addPendingChange, // Этот экшен нужен для модального окна
} from '../../app/store/slices/scheduleSlice';

// Utils & Constants
import { getNextSunday } from '../../shared/lib/utils/scheduleUtils';
import { ALGORITHM_TYPES } from '../../shared/config/scheduleConstants';
import './ScheduleManagement.css';

// --- Основной компонент ---

const ScheduleManagement = () => {
    const messages = useMessages('en');
    const dispatch = useDispatch();

    const {
        schedules,
        scheduleDetails,
        loading,
        error,
        activeTab,
        selectedScheduleId,
        editingPositions,
        pendingChanges,
    } = useSelector((state) => state.schedule);

    // --- Локальное состояние для UI, управляемое этим компонентом ---
    const [alert, setAlert] = useState(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null); // Для выбора сотрудника
    const [generationSettings, setGenerationSettings] = useState({
        site_id: 1,
        algorithm: ALGORITHM_TYPES.AUTO,
        weekStart: getNextSunday(),
    });

    // --- Эффекты ---
    useEffect(() => {
        dispatch(fetchSchedules());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error });
            const timer = setTimeout(() => setAlert(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // --- Обработчики ---

    const handleGenerate = async (settings) => {
        const resultAction = await dispatch(generateSchedule(settings));
        if (generateSchedule.fulfilled.match(resultAction)) {
            setAlert({ type: 'success', message: `Schedule generated!` });
            setShowGenerateModal(false);
        }
    };

    const handleCompare = async () => {
        const resultAction = await dispatch(compareAlgorithms({ site_id: 1, week_start: getNextSunday() }));
        if (compareAlgorithms.fulfilled.match(resultAction)) {
            setComparisonResults(resultAction.payload);
            setShowComparisonModal(true);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm(messages.CONFIRM_DELETE)) {
            dispatch(deleteSchedule(id)).then(() => setAlert({ type: 'success', message: 'Schedule deleted.' }));
        }
    };

    const handleUseAlgorithm = (algorithm) => {
        setGenerationSettings(prev => ({ ...prev, algorithm }));
        setShowComparisonModal(false);
        setShowGenerateModal(true);
    };

    const handleCellClick = (date, positionId, shiftId) => {
        setSelectedCell({ date, positionId, shiftId });
        setShowEmployeeModal(true);
    };

    const handleEmployeeSelect = (empId, empName) => {
        if (!selectedCell) return;
        const { date, shiftId, positionId } = selectedCell;
        const key = `${positionId}-${date}-${shiftId}-assign-${empId}`;
        dispatch(addPendingChange({ key, change: { action: 'assign', empId, empName, date, shiftId, positionId } }));
        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                {/* Заголовок */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    {/* ... JSX заголовка ... */}
                </div>

                <AlertMessage alert={alert} onClose={() => setAlert(null)} />

                <Tabs activeKey={activeTab} onSelect={(k) => dispatch(setActiveTab(k))} className="mb-4">
                    <Tab eventKey="overview" title={messages.SCHEDULES}>
                        <ScheduleOverviewTable
                            schedules={schedules}
                            loading={loading === 'pending' && !schedules.length}
                            onViewDetails={(id) => dispatch(fetchScheduleDetails(id))}
                            onScheduleDeleted={handleDelete}
                        />
                    </Tab>
                    <Tab eventKey="view" title={messages.SCHEDULE_DETAILS} disabled={!selectedScheduleId}>
                        {loading === 'pending' && !scheduleDetails ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            // Теперь передаем меньше пропсов
                            <ScheduleDetailsView
                                scheduleDetails={scheduleDetails}
                                editingPositions={editingPositions}
                                pendingChanges={pendingChanges}
                                // onCellClick нужно передать, т.к. он открывает модалку в этом компоненте
                                onCellClick={handleCellClick}
                            />
                        )}
                    </Tab>
                </Tabs>

                {/* Модальные окна остаются здесь, т.к. управляются этим компонентом */}
                <GenerateScheduleModal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} onGenerate={handleGenerate} generating={loading === 'pending'} />
                <CompareAlgorithmsModal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} results={comparisonResults} onUseAlgorithm={handleUseAlgorithm} />
                <EmployeeSelectionModal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} selectedPosition={selectedCell} onEmployeeSelect={handleEmployeeSelect} scheduleDetails={scheduleDetails} />
            </Container>
        </AdminLayout>
    );
};

export default ScheduleManagement;