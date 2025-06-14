// frontend/src/features/schedule-management/ScheduleManagement.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useMessages } from '../../shared/lib/i18n/messages';

// Widgets, UI, etc.
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
    addPendingChange,
} from '../../app/store/slices/scheduleSlice';

// Utils
import { getNextSunday } from '../../shared/lib/utils/scheduleUtils';
import './ScheduleManagement.css';

// --- Компонент заголовка, как и был ---
const ScheduleHeader = ({ messages, onGenerateClick, onCompareClick, loading }) => (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
            <h1 className="h3 mb-2 text-dark fw-bold">
                <i className="bi bi-calendar-week me-2 text-primary"></i>
                {messages.SCHEDULE_MANAGEMENT}
            </h1>
            <p className="text-muted mb-0">{messages.CREATE_MANAGE_SCHEDULES}</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
            <Button variant="outline-primary" onClick={onCompareClick} disabled={loading}>
                {loading ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-speedometer2 me-2"></i>}
                {messages.COMPARE_ALGORITHMS}
            </Button>
            <Button variant="primary" onClick={onGenerateClick} disabled={loading}>
                {loading ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-plus-circle me-2"></i>}
                {messages.GENERATE_SCHEDULE}
            </Button>
        </div>
    </div>
);

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
        pendingChanges
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

    useEffect(() => {
        if (error) {
            setAlert({ type: 'danger', message: error });
            const timer = setTimeout(() => setAlert(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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
        if (window.confirm(messages.CONFIRM_DELETE)) {
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
                <ScheduleHeader
                    messages={messages}
                    onGenerateClick={() => setShowGenerateModal(true)}
                    onCompareClick={handleCompare}
                    loading={loading === 'pending'}
                />

                <AlertMessage alert={alert} onClose={() => setAlert(null)} />

                <Tabs activeKey={activeTab} onSelect={(k) => dispatch(setActiveTab(k))} className="mb-4">
                    <Tab eventKey="overview" title={messages.SCHEDULES}>
                        <ScheduleOverviewTable
                            schedules={schedules}
                            loading={loading === 'pending' && !schedules.length}
                            onViewDetails={(id) => dispatch(fetchScheduleDetails(id))}
                            onDelete={handleDelete}
                        />
                    </Tab>
                    <Tab eventKey="view" title={messages.SCHEDULE_DETAILS} disabled={!selectedScheduleId}>
                        {loading === 'pending' && !scheduleDetails ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <ScheduleDetailsView onCellClick={handleCellClick} />
                        )}
                    </Tab>
                </Tabs>

                <GenerateScheduleModal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} onGenerate={handleGenerate} generating={loading === 'pending'} />
                <CompareAlgorithmsModal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} results={comparisonResults} onUseAlgorithm={() => {}} />
                <EmployeeSelectionModal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} selectedPosition={selectedCell} onEmployeeSelect={handleEmployeeSelect} scheduleDetails={scheduleDetails} />
            </Container>
        </AdminLayout>
    );
};

export default ScheduleManagement;