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
    generateSchedule,
    compareAlgorithms,
    deleteSchedule,
    setActiveTab,
    //resetScheduleView,
    addPendingChange,
} from '../../app/store/slices/scheduleSlice';

// Utils
import './ScheduleManagement.css';


// --- Основной компонент ---
const ScheduleManagement = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const {
        schedules,
        scheduleDetails,
        loading,
        error,
        activeTab,
        selectedScheduleId,
        //editingPositions,
        //pendingChanges
    } = useSelector((state) => state.schedule);

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
    const handleGenerate = async (settings) => {
        const result = await dispatch(generateSchedule(settings)).unwrap();
        setAlert({ type: 'success', message: `Schedule generated with ${result.assignments_count || 0} assignments!` });
        setShowGenerateModal(false);
    };

    const handleCompare = async () => {
        const result = await dispatch(compareAlgorithms({})).unwrap();
        setComparisonResults(result);
        setShowComparisonModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm(t.confirmDelete)) {
            dispatch(deleteSchedule(id)).then(() => setAlert({ type: 'success', message: 'Schedule deleted.' }));
        }
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
                {alert && (
                    <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                        {alert.message}
                    </Alert>
                )}
                <ScheduleHeader
                    messages={t}
                    onGenerateClick={() => setShowGenerateModal(true)}
                    onCompareClick={handleCompare}
                    loading={loading === 'pending'}
                />

                <ScheduleTabs
                    activeTab={activeTab}
                    onTabChange={(k) => dispatch(setActiveTab(k))}
                    isDetailsDisabled={!selectedScheduleId}
                >
                    {{
                        overview: (
                            <ScheduleOverviewTable
                                schedules={schedules}
                                loading={loading === 'pending' && !schedules.length}
                                onViewDetails={(id) => dispatch(fetchScheduleDetails(id))}
                                onDelete={handleDelete}
                            />
                        ),
                        details: loading === 'pending' && !scheduleDetails ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <ScheduleDetailsView onCellClick={handleCellClick} />
                        )
                    }}
                </ScheduleTabs>

                <GenerateScheduleModal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} onGenerate={handleGenerate} generating={loading === 'pending'} />
                <CompareAlgorithmsModal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} results={comparisonResults} onUseAlgorithm={() => {}} />
                <EmployeeSelectionModal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} selectedPosition={selectedCell} onEmployeeSelect={handleEmployeeSelect} scheduleDetails={scheduleDetails} />
            </Container>
        </AdminLayout>
    );
};

export default ScheduleManagement;