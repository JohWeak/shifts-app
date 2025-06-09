// frontend/src/components/admin/ScheduleManagement.js
import React, { useEffect } from 'react';
import { Container, Button, Tabs, Tab } from 'react-bootstrap';
import AdminLayout from './AdminLayout';
import { useMessages } from '../../i18n/messages';

// Custom Hooks
import useScheduleState from '../../hooks/useScheduleState';
import useScheduleOperations from '../../hooks/useScheduleOperations';

// Common Components
import AlertMessage from './common/AlertMessage';
import ErrorBoundary from './common/ErrorBoundary';

// Schedule Components
import ScheduleOverviewTable from './schedule/ScheduleOverviewTable';
import ScheduleDetailsView from './schedule/ScheduleDetailsView';
import GenerateScheduleModal from './schedule/GenerateScheduleModal';
import CompareAlgorithmsModal from './schedule/CompareAlgorithmsModal';
import EmployeeSelectionModal from './schedule/EmployeeSelectionModal';

// Utils
import { getNextSunday } from '../../utils/scheduleUtils';

// Styles
import './ScheduleManagement.css';

/**
 * Main Schedule Management Component
 * Orchestrates the entire schedule management workflow
 */
const ScheduleManagement = () => {
    // Get messages for internationalization
    const messages = useMessages('en');

    // Initialize state and operations
    const state = useScheduleState();
    const operations = useScheduleOperations(state);

    // Initialize component
    useEffect(() => {
        initializeComponent();
    }, []);

    const initializeComponent = async () => {
        // Set default week start to next Sunday
        state.setGenerateSettings(prev => ({
            ...prev,
            weekStart: getNextSunday()
        }));

        // Fetch initial data
        await operations.handleFetchSchedules();
    };

    const handleGenerateSchedule = async (settings) => {
        await operations.handleGenerateSchedule(settings);
        state.setShowGenerateModal(false);
    };

    const handleUseAlgorithm = (algorithm) => {
        state.setGenerateSettings(prev => ({
            ...prev,
            algorithm: algorithm
        }));
        state.setShowComparisonModal(false);
        state.setShowGenerateModal(true);
    };

    // callback для обновления после публикации
    const handleScheduleStatusUpdate = async (scheduleId, newStatus) => {
        return await operations.handleScheduleStatusUpdate(scheduleId, newStatus);
    };

    return (
        <ErrorBoundary>
            <AdminLayout>
                <Container fluid className="px-0">
                    {/* Page Header */}
                    <ScheduleHeader
                        messages={messages}
                        onGenerateClick={() => state.setShowGenerateModal(true)}
                        onCompareClick={() => operations.handleCompareAlgorithms()}
                        generating={state.generating}
                        comparing={state.comparing}
                    />

                    {/* Alert Messages */}
                    <AlertMessage
                        alert={state.alert}
                        onClose={state.clearAlert}
                    />

                    {/* Content Tabs */}
                    <Tabs
                        activeKey={state.activeTab}
                        onSelect={(k) => state.setActiveTab(k)}
                        className="mb-4"
                    >
                        <Tab eventKey="overview" title={messages.SCHEDULES || 'Schedules'}>
                            <ScheduleOverviewTable
                                schedules={state.schedules}
                                loading={operations.apiLoading}
                                onViewDetails={operations.handleViewScheduleDetails}
                                onScheduleDeleted={operations.handleScheduleDeleted}
                            />
                        </Tab>

                        <Tab
                            eventKey="view"
                            title={messages.SCHEDULE_DETAILS || 'Schedule Details'}
                            disabled={!state.selectedSchedule}
                        >
                            <ScheduleDetailsView
                                scheduleDetails={state.scheduleDetails}
                                editingPositions={state.editingPositions}
                                pendingChanges={state.pendingChanges}
                                savingChanges={state.savingChanges}
                                onToggleEditPosition={state.toggleEditPosition}
                                onSavePositionChanges={operations.handleSavePositionChanges}
                                onCellClick={operations.handleCellClick}
                                onEmployeeRemove={operations.handleEmployeeRemove}
                                onRemovePendingChange={state.removePendingChange}
                                onStatusUpdate={handleScheduleStatusUpdate}
                            />
                        </Tab>
                    </Tabs>

                    {/* Modals */}
                    <ScheduleModals
                        state={state}
                        operations={operations}
                        onGenerateSchedule={handleGenerateSchedule}
                        onUseAlgorithm={handleUseAlgorithm}
                    />
                </Container>
            </AdminLayout>
        </ErrorBoundary>
    );
};

/**
 * Schedule Header Component
 * Separated for better organization
 */
const ScheduleHeader = ({ messages, onGenerateClick, onCompareClick, generating, comparing }) => (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
            <h1 className="h3 mb-2 text-dark fw-bold">
                <i className="bi bi-calendar-week me-2 text-primary"></i>
                {messages.SCHEDULE_MANAGEMENT || 'Schedule Management'}
            </h1>
            <p className="text-muted mb-0">
                {messages.CREATE_MANAGE_SCHEDULES || 'Create and manage work schedules'}
            </p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
            <Button
                variant="outline-primary"
                onClick={onCompareClick}
                disabled={generating || comparing}
                className="d-flex align-items-center justify-content-center"
            >
                {comparing ? (
                    <>
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        {messages.COMPARING || 'Comparing...'}
                    </>
                ) : (
                    <>
                        <i className="bi bi-speedometer2 me-2"></i>
                        {messages.COMPARE_ALGORITHMS || 'Compare Algorithms'}
                    </>
                )}
            </Button>
            <Button
                variant="primary"
                onClick={onGenerateClick}
                disabled={generating}
                className="d-flex align-items-center justify-content-center"
            >
                <i className="bi bi-plus-circle me-2"></i>
                {messages.GENERATE_SCHEDULE || 'Generate Schedule'}
            </Button>
        </div>
    </div>
);

/**
 * Schedule Modals Component
 * Groups all modals for better organization
 */
const ScheduleModals = ({ state, operations, onGenerateSchedule, onUseAlgorithm }) => (
    <>
        <GenerateScheduleModal
            show={state.showGenerateModal}
            onHide={() => state.setShowGenerateModal(false)}
            onGenerate={onGenerateSchedule}
            generating={state.generating}
        />

        <CompareAlgorithmsModal
            show={state.showComparisonModal}
            onHide={() => state.setShowComparisonModal(false)}
            results={state.comparisonResults}
            onUseAlgorithm={onUseAlgorithm}
        />

        <EmployeeSelectionModal
            show={state.showEmployeeModal}
            onHide={() => state.setShowEmployeeModal(false)}
            recommendations={state.recommendations}
            loading={state.loadingRecommendations}
            selectedCell={state.selectedCell}
            onEmployeeSelect={operations.handleEmployeeAssign}
        />
    </>
);

export default ScheduleManagement;