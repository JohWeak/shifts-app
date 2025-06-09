// frontend/src/hooks/useScheduleOperations.js
import { useScheduleAPI } from './useScheduleAPI';
import { MESSAGES, interpolateMessage } from '../i18n/messages';
import { generateChangeKey } from '../utils/scheduleUtils';

export const useScheduleOperations = (state) => {
    const {
        schedules,
        setSchedules,
        setScheduleDetails,
        setSelectedSchedule,
        setActiveTab,
        pendingChanges,
        setPendingChanges,
        setRecommendations,
        setLoadingRecommendations,
        setComparisonResults,
        setShowComparisonModal,
        setShowEmployeeModal,
        setSelectedCell,
        showAlert,
        toggleEditPosition,
        clearPendingChangesForPosition,
        resetScheduleView
    } = state;

    const api = useScheduleAPI();

    const handleFetchSchedules = async () => {
        try {
            const schedulesData = await api.fetchSchedules();
            setSchedules(schedulesData);
        } catch (err) {
            showAlert('danger', err.message);
        }
    };

    const handleViewScheduleDetails = async (scheduleId) => {
        try {
            const detailsData = await api.fetchScheduleDetails(scheduleId);
            setScheduleDetails(detailsData);
            setSelectedSchedule(scheduleId);
            setActiveTab('view');
        } catch (err) {
            showAlert('danger', err.message);
        }
    };

    const handleGenerateSchedule = async (settings) => {
        try {
            const result = await api.generateSchedule(settings);

            showAlert('success', `Schedule generated successfully! ${result?.assignments || 0} assignments created.`);

            await handleFetchSchedules();

            if (result?.schedule?.id) {
                await handleViewScheduleDetails(result.schedule.id);
            }
        } catch (err) {
            showAlert('danger', `Error generating schedule: ${err.message}`);
        }
    };

    const handleCompareAlgorithms = async (settings = {}) => {
        try {
            const result = await api.compareAlgorithms(settings);

            setComparisonResults({
                comparison: result.comparison,
                best_algorithm: result.comparison.recommended,
                recommendation: result.message
            });
            setShowComparisonModal(true);

            showAlert('success', `Algorithm comparison completed! Best algorithm: ${result.comparison.recommended}`);
        } catch (err) {
            showAlert('danger', `Error comparing algorithms: ${err.message}`);
        }
    };

    const handleScheduleDeleted = async (deletedSchedule) => {
        showAlert('success',
            `Schedule for week ${new Date(deletedSchedule.start_date).toLocaleDateString()} - ${new Date(deletedSchedule.end_date).toLocaleDateString()} has been deleted successfully.`
        );

        await handleFetchSchedules();

        if (state.selectedSchedule === deletedSchedule.id) {
            resetScheduleView();
        }
    };

    const handleScheduleStatusUpdate = async (scheduleId, newStatus) => {
        try {
            await api.updateScheduleStatus(scheduleId, newStatus);

            // Обновляем статус в локальном списке расписаний без перезагрузки
            setSchedules(prevSchedules =>
                prevSchedules.map(schedule =>
                    schedule.id === scheduleId
                        ? { ...schedule, status: newStatus }
                        : schedule
                )
            );

            // Обновляем детали расписания если они открыты
            if (state.selectedSchedule === scheduleId && state.scheduleDetails) {
                setScheduleDetails(prevDetails => ({
                    ...prevDetails,
                    schedule: {
                        ...prevDetails.schedule,
                        status: newStatus
                    }
                }));
            }

            showAlert('success', `Schedule status updated to ${newStatus} successfully!`);
            return true;
        } catch (err) {
            showAlert('danger', `Error updating schedule status: ${err.message}`);
            return false;
        }
    };

    const handleCellClick = async (positionId, date, shiftId) => {
        if (!state.editingPositions.has(positionId)) return;

        setSelectedCell({ positionId, date, shiftId });
        setLoadingRecommendations(true);
        setShowEmployeeModal(true);

        try {
            const allEmployees = state.scheduleDetails?.all_employees || [];

            const formattedEmployees = allEmployees.map(emp => ({
                emp_id: emp.emp_id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email,
                availability_status: 'available',
                priority: 1
            }));

            setRecommendations({
                recommendations: {
                    available: formattedEmployees,
                    preferred: [],
                    cannot_work: [],
                    violates_constraints: []
                }
            });
        } catch (err) {
            console.error('Error getting recommendations:', err);
            setRecommendations({
                recommendations: {
                    available: [],
                    preferred: [],
                    cannot_work: [],
                    violates_constraints: []
                }
            });
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleEmployeeAssign = (empId, empName) => {
        const { date, shiftId, positionId } = state.selectedCell;
        const changeKey = generateChangeKey(positionId, date, shiftId, 'add', empId);

        setPendingChanges(prev => ({
            ...prev,
            [changeKey]: {
                action: 'assign',
                empId,
                empName,
                date,
                shiftId,
                positionId
            }
        }));

        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    const handleEmployeeRemove = (date, shiftId, positionId, assignmentId) => {
        const changeKey = generateChangeKey(positionId, date, shiftId, 'remove', assignmentId);

        setPendingChanges(prev => ({
            ...prev,
            [changeKey]: {
                action: 'remove',
                assignmentId,
                date,
                shiftId,
                positionId
            }
        }));
    };

    const handleSavePositionChanges = async (positionId) => {
        try {
            const positionChanges = Object.values(pendingChanges).filter(
                change => change.positionId === positionId
            );

            if (positionChanges.length === 0) {
                showAlert('info', MESSAGES.NO_CHANGES_TO_SAVE);
                toggleEditPosition(positionId);
                return;
            }

            const result = await api.updateScheduleAssignments(state.selectedSchedule, positionChanges);

            await handleViewScheduleDetails(state.selectedSchedule);
            clearPendingChangesForPosition(positionId);
            toggleEditPosition(positionId);

            showAlert('success', interpolateMessage(MESSAGES.POSITION_CHANGES_SAVED, {
                count: result?.changesProcessed || positionChanges.length
            }));
        } catch (err) {
            showAlert('danger', interpolateMessage(MESSAGES.ERROR_SAVING_CHANGES, {
                error: err.message
            }));
        }
    };

    return {
        handleFetchSchedules,
        handleViewScheduleDetails,
        handleGenerateSchedule,
        handleCompareAlgorithms,
        handleScheduleDeleted,
        handleCellClick,
        handleEmployeeAssign,
        handleEmployeeRemove,
        handleSavePositionChanges,
        handleScheduleStatusUpdate,
        apiLoading: api.loading,
        apiError: api.error

    };
};

export default useScheduleOperations;