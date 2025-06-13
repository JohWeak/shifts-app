// frontend/src/shared/lib/hooks/useScheduleOperations.js
import { useState } from 'react';
// Импортируем функции API напрямую
import * as scheduleAPI from '../../api/scheduleAPI';
// Импортируем утилиты и сообщения из их новых расположений
import { MESSAGES, interpolateMessage } from '../i18n/messages';

// Утилита для генерации ключей изменений остаётся здесь, так как это логика операций
const generateChangeKey = (positionId, date, shiftId, action, empId) => {
    return `${positionId}-${date}-${shiftId}-${action}-${empId}`;
};

export const useScheduleOperations = (state) => {
    const {
        // Здесь мы по-прежнему получаем сеттеры состояния из хука useScheduleState
        // или в будущем из Redux
        setSchedules,
        setScheduleDetails,
        setSelectedSchedule,
        setActiveTab,
        setPendingChanges,
        setShowComparisonModal,
        setComparisonResults,
        setIsModalOpen,
        setSelectedPosition,
        showAlert,
        toggleEditPosition,
        clearPendingChangesForPosition,
        resetScheduleView
    } = state;

    // Локальное состояние для загрузки/ошибки, управляемое этим хуком
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Обертка для всех API-запросов
    const handleRequest = async (requestFn, showSuccess = false, successMessage = 'Operation successful!') => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await requestFn();
            if (showSuccess) {
                showAlert('success', successMessage);
            }
            return result;
        } catch (err) {
            setError(err.message);
            showAlert('danger', err.message);
            // Пробрасываем ошибку дальше, если это нужно для логики UI
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchSchedules = async () => {
        await handleRequest(async () => {
            const schedulesData = await scheduleAPI.fetchSchedules();
            setSchedules(schedulesData);
        });
    };

    const handleViewScheduleDetails = async (scheduleId) => {
        await handleRequest(async () => {
            const detailsData = await scheduleAPI.fetchScheduleDetails(scheduleId);
            setScheduleDetails(detailsData);
            setSelectedSchedule(scheduleId);
            setActiveTab('view');
        });
    };

    const handleGenerateSchedule = async (settings) => {
        await handleRequest(async () => {
            const result = await scheduleAPI.generateSchedule(settings);
            showAlert('success', `Schedule generated! ${result?.assignments_count || 0} assignments created.`);
            await handleFetchSchedules(); // Обновляем список расписаний
            if (result?.schedule_id) {
                await handleViewScheduleDetails(result.schedule_id);
            }
        });
    };

    const handleCompareAlgorithms = async (settings = {}) => {
        await handleRequest(async () => {
            const result = await scheduleAPI.compareAlgorithms(settings);
            setComparisonResults({
                comparison: result.comparison,
                best_algorithm: result.comparison.recommended,
                recommendation: result.message,
            });
            setShowComparisonModal(true);
            showAlert('success', `Comparison complete! Best: ${result.comparison.recommended}`);
        });
    };

    const handleScheduleDeleted = async (deletedSchedule) => {
        showAlert('success', `Schedule for week starting ${new Date(deletedSchedule.start_date).toLocaleDateString()} has been deleted.`);
        await handleFetchSchedules();
        if (state.selectedSchedule === deletedSchedule.id) {
            resetScheduleView();
        }
    };

    const handleScheduleStatusUpdate = async (scheduleId, newStatus) => {
        return handleRequest(async () => {
            await scheduleAPI.updateScheduleStatus(scheduleId, newStatus);
            // Обновляем состояние локально для мгновенного отклика
            state.setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, status: newStatus } : s));
            if (state.scheduleDetails?.schedule.id === scheduleId) {
                state.setScheduleDetails(prev => ({ ...prev, schedule: { ...prev.schedule, status: newStatus } }));
            }
            showAlert('success', `Schedule status updated to ${newStatus}.`);
            return true;
        }, false); // Не показываем стандартное сообщение об успехе
    };

    const handleSavePositionChanges = async (positionId) => {
        const positionChanges = Object.values(state.pendingChanges).filter(
            change => change.positionId === positionId
        );

        if (positionChanges.length === 0) {
            showAlert('info', MESSAGES.en.NO_CHANGES_TO_SAVE);
            toggleEditPosition(positionId);
            return;
        }

        await handleRequest(async () => {
            const result = await scheduleAPI.updateScheduleAssignments(state.selectedSchedule, positionChanges);
            await handleViewScheduleDetails(state.selectedSchedule); // Перезагружаем детали
            clearPendingChangesForPosition(positionId);
            toggleEditPosition(positionId);
            showAlert('success', interpolateMessage(MESSAGES.en.POSITION_CHANGES_SAVED, {
                count: result?.changesProcessed || positionChanges.length
            }));
        });
    };

    // --- Логика назначения/удаления сотрудников (остается без изменений) ---
    const handleCellClick = (date, positionId, shiftId) => {
        setSelectedPosition({ date, positionId, shiftId, key: `${date}-${positionId}-${shiftId}` });
        setIsModalOpen(true);
    };

    const handleEmployeeClick = (date, positionId, shiftId, currentEmpId) => {
        setSelectedPosition({ date, positionId, shiftId, key: `${date}-${positionId}-${shiftId}`, replaceEmployeeId: currentEmpId });
        setIsModalOpen(true);
    };

    const handleRemoveEmployee = (date, positionId, shiftId, empId) => {
        const pendingAssignmentKey = Object.keys(state.pendingChanges).find(key => {
            const change = state.pendingChanges[key];
            return change.action === 'assign' && change.empId === empId && change.date === date && change.shiftId === shiftId && change.positionId === positionId;
        });

        if (pendingAssignmentKey) {
            setPendingChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[pendingAssignmentKey];
                return newChanges;
            });
        } else {
            const existingAssignment = state.scheduleDetails?.assignments?.find(a => a.position_id === positionId && a.shift_id === shiftId && a.work_date === date && a.emp_id === empId);
            if (existingAssignment) {
                const changeKey = generateChangeKey(positionId, date, shiftId, 'remove', empId);
                setPendingChanges(prev => ({
                    ...prev,
                    [changeKey]: { action: 'remove', empId, assignmentId: existingAssignment.id, date, shiftId, positionId }
                }));
            }
        }
        showAlert('success', 'Employee marked for removal.');
    };

    const handleEmployeeAssign = (empId, empName) => {
        if (!state.selectedPosition) return;
        const { date, shiftId, positionId, replaceEmployeeId } = state.selectedPosition;

        if (replaceEmployeeId) {
            // Замена
            handleRemoveEmployee(date, positionId, shiftId, replaceEmployeeId);
        }

        const changeKey = generateChangeKey(positionId, date, shiftId, 'assign', empId);
        setPendingChanges(prev => ({
            ...prev,
            [changeKey]: { action: 'assign', empId, empName, date, shiftId, positionId }
        }));

        setIsModalOpen(false);
        setSelectedPosition(null);
        showAlert('success', replaceEmployeeId ? 'Employee marked for replacement.' : 'Employee marked for assignment.');
    };

    return {
        // Состояния
        isLoading,
        error,
        // Операции
        handleFetchSchedules,
        handleViewScheduleDetails,
        handleGenerateSchedule,
        handleCompareAlgorithms,
        handleScheduleDeleted,
        handleScheduleStatusUpdate,
        handleSavePositionChanges,
        handleCellClick,
        handleEmployeeClick,
        handleRemoveEmployee,
        handleEmployeeAssign,
    };
};